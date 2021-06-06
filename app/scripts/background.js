/**
 * @file The entry point for the web extension singleton process.
 */
// these need to run before anything else
/* eslint-disable import/first,import/order */
import "./lib/freezeGlobals";
import setupFetchDebugging from "./lib/setupFetchDebugging";
/* eslint-enable import/order */

setupFetchDebugging();

// polyfills
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";

import endOfStream from "end-of-stream";
import pump from "pump";
import debounce from "debounce-stream";
import log from "loglevel";
import extension from "extensionizer";
import storeTransform from "obs-store/lib/transform";
import asStream from "obs-store/lib/asStream";
import PortStream from "extension-port-stream";
import migrations from "./migrations";
import Migrator from "./lib/migrator";
import ExtensionPlatform from "./platforms/extension";
import LocalStore from "./lib/local-store";
import ReadOnlyNetworkStore from "./lib/network-store";
import createStreamSink from "./lib/createStreamSink";
import NotificationManager from "./lib/notification-manager";
import TaquinController from "./metamask-controller";
import rawFirstTimeState from "./first-time-state";
//import setupSentry from "./lib/setupSentry";
import getFirstPreferredLangCode from "./lib/get-first-preferred-lang-code";
import getObjStructure from "./lib/getObjStructure";
import setupEnsIpfsResolver from "./lib/ens-ipfs/setup";

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from "./lib/enums";
/* eslint-enable import/first */

const firstTimeState = { ...rawFirstTimeState, ...global.METAMASK_TEST_CONFIG };

log.setDefaultLevel(process.env.METAMASK_DEBUG ? "debug" : "warn");

const platform = new ExtensionPlatform();
const notificationManager = new NotificationManager();
global.METAMASK_NOTIFIER = notificationManager;

// setup sentry error reporting
const release = platform.getVersion();
//const sentry = setupSentry({ release });

let popupIsOpen = false;
let notificationIsOpen = false;
const openMetamaskTabsIDs = {};
const requestAccountTabIds = {};

// state persistence
const inTest = process.env.IN_TEST === "true";
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
let versionedData;

if (inTest || process.env.METAMASK_DEBUG) {
  global.metamaskGetState = localStore.get.bind(localStore);
}

// initialization flow
initialize().catch(log.error);

async function initialize() {
  const initState = await loadStateFromPersistence();
  const initLangCode = await getFirstPreferredLangCode();
  await setupController(initState, initLangCode);
}

async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({ migrations });
  migrator.on("error", console.warn);

  // read from disk
  // first from preferred, async API:
  versionedData =
    (await localStore.get()) || migrator.generateInitialState(firstTimeState);
  // check if somehow state is empty
  // this should never happen but new error reporting suggests that it has
  // for a small number of users
  if (versionedData && !versionedData.data) {
    // unable to recover, clear state
    versionedData = migrator.generateInitialState(firstTimeState);
  }

  // report migration errors to sentry
  migrator.on("error", (err) => {
    // get vault structure without secrets
  });

  // migrate data
  versionedData = await migrator.migrateData(versionedData);
  if (!versionedData) {
    throw new Error("Taquin - migrator returned undefined");
  }

  // write to disk
  if (localStore.isSupported) {
    localStore.set(versionedData);
  } else {
    // throw in setTimeout so as to not block boot
    setTimeout(() => {
      throw new Error("Taquin - Localstore not supported");
    });
  }

  // return just the data
  return versionedData.data;
}

/**
 * Initializes the Taquin Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {Object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 * @returns {Promise} - After setup is complete.
 */
function setupController(initState, initLangCode) {
  //
  // Taquin Controller
  //

  const controller = new TaquinController({
    // User confirmation callbacks:
    showUnconfirmedMessage: triggerUi,
    showUnapprovedTx: triggerUi,
    showPermissionRequest: triggerUi,
    showUnlockRequest: triggerUi,
    openPopup,
    // initial state
    initState,
    // initial locale code
    initLangCode,
    // platform specific api
    platform,
    getRequestAccountTabIds: () => {
      return requestAccountTabIds;
    },
    getOpenMetamaskTabsIds: () => {
      return openMetamaskTabsIDs;
    },
  });

  setupEnsIpfsResolver({
    getCurrentNetwork: controller.getCurrentNetwork,
    getIpfsGateway: controller.preferencesController.getIpfsGateway.bind(
      controller.preferencesController
    ),
    provider: controller.provider,
  });

  // setup state persistence
  pump(
    asStream(controller.store),
    debounce(1000),
    storeTransform(versionifyData),
    createStreamSink(persistData),
    (error) => {
      log.error("Taquin - Persistence pipeline failed", error);
    }
  );

  function versionifyData(state) {
    versionedData.data = state;
    return versionedData;
  }

  async function persistData(state) {
    if (!state) {
      throw new Error("Taquin - updated state is missing");
    }
    if (!state.data) {
      throw new Error("Taquin - updated state does not have data");
    }
    if (localStore.isSupported) {
      try {
        await localStore.set(state);
      } catch (err) {
        // log error so we dont break the pipeline
        log.error("error setting state in local store:", err);
      }
    }
  }

  //
  // connect to other contexts
  //
  extension.runtime.onConnect.addListener(connectRemote);
  extension.runtime.onConnectExternal.addListener(connectExternal);

  const metamaskInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
  };

  const metamaskBlockedPorts = ["trezor-connect"];

  const isClientOpenStatus = () => {
    return (
      popupIsOpen ||
      Boolean(Object.keys(openMetamaskTabsIDs).length) ||
      notificationIsOpen
    );
  };

  /**
   * A runtime.Port object, as provided by the browser:
   * @see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/Port
   * @typedef Port
   * @type Object
   */

  function connectRemote(remotePort) {
    const processName = remotePort.name;
    const isMetaMaskInternalProcess = metamaskInternalProcessHash[processName];

    if (metamaskBlockedPorts.includes(remotePort.name)) {
      return;
    }

    if (isMetaMaskInternalProcess) {
      const portStream = new PortStream(remotePort);
      // communication with popup
      controller.isClientOpen = true;
      controller.setupTrustedCommunication(portStream, remotePort.sender);

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        popupIsOpen = true;

        endOfStream(portStream, () => {
          popupIsOpen = false;
          controller.isClientOpen = isClientOpenStatus();
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        endOfStream(portStream, () => {
          notificationIsOpen = false;
          controller.isClientOpen = isClientOpenStatus();
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        openMetamaskTabsIDs[tabId] = true;

        endOfStream(portStream, () => {
          delete openMetamaskTabsIDs[tabId];
          controller.isClientOpen = isClientOpenStatus();
        });
      }
    } else {
      if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
        const tabId = remotePort.sender.tab.id;
        const url = new URL(remotePort.sender.url);
        const { origin } = url;

        remotePort.onMessage.addListener((msg) => {
          if (msg.data && msg.data.method === "eth_requestAccounts") {
            requestAccountTabIds[origin] = tabId;
          }
        });
      }
      connectExternal(remotePort);
    }
  }

  // communication with page or other extension
  function connectExternal(remotePort) {
    const portStream = new PortStream(remotePort);
    controller.setupUntrustedCommunication(portStream, remotePort.sender);
  }

  //
  // User Interface setup
  //

  updateBadge();
  controller.txController.on("update:badge", updateBadge);
  controller.messageManager.on("updateBadge", updateBadge);
  controller.personalMessageManager.on("updateBadge", updateBadge);
  controller.decryptMessageManager.on("updateBadge", updateBadge);
  controller.encryptionPublicKeyManager.on("updateBadge", updateBadge);
  controller.typedMessageManager.on("updateBadge", updateBadge);
  controller.permissionsController.permissions.subscribe(updateBadge);
  controller.appStateController.on("updateBadge", updateBadge);

  /**
   * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
   * The number reflects the current number of pending transactions or message signatures needing user approval.
   */
  function updateBadge() {
    let label = "";
    const unapprovedTxCount = controller.txController.getUnapprovedTxCount();
    const { unapprovedMsgCount } = controller.messageManager;
    const { unapprovedPersonalMsgCount } = controller.personalMessageManager;
    const { unapprovedDecryptMsgCount } = controller.decryptMessageManager;
    const { unapprovedEncryptionPublicKeyMsgCount } =
      controller.encryptionPublicKeyManager;
    const { unapprovedTypedMessagesCount } = controller.typedMessageManager;
    const pendingPermissionRequests = Object.keys(
      controller.permissionsController.permissions.state.permissionsRequests
    ).length;
    const waitingForUnlockCount =
      controller.appStateController.waitingForUnlock.length;
    const count =
      unapprovedTxCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount +
      unapprovedTypedMessagesCount +
      pendingPermissionRequests +
      waitingForUnlockCount;
    if (count) {
      label = String(count);
    }
    extension.browserAction.setBadgeText({ text: label });
    extension.browserAction.setBadgeBackgroundColor({ color: "#037DD6" });
  }

  return Promise.resolve();
}

//
// Etc...
//

/**
 * Opens the browser popup for user confirmation
 */
async function triggerUi() {
  const tabs = await platform.getActiveTabs();
  const currentlyActiveMetamaskTab = Boolean(
    tabs.find((tab) => openMetamaskTabsIDs[tab.id])
  );
  if (!popupIsOpen && !currentlyActiveMetamaskTab) {
    await notificationManager.showPopup();
  }
}

/**
 * Opens the browser popup for user confirmation of watchAsset
 * then it waits until user interact with the UI
 */
async function openPopup() {
  await triggerUi();
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!notificationIsOpen) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

// On first install, open a new tab with MetaMask
extension.runtime.onInstalled.addListener(({ reason }) => {
  if (
    reason === "install" &&
    !(process.env.METAMASK_DEBUG || process.env.IN_TEST)
  ) {
    platform.openExtensionInBrowser();
  }
});

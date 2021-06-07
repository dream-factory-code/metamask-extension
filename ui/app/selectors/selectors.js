import { stripHexPrefix, addHexPrefix } from "ethereumjs-util";
import { createSelector } from "reselect";
import { NETWORK_TYPES } from "../helpers/constants/common";
import {
  shortenAddress,
  checksumAddress,
  getAccountByAddress,
} from "../helpers/utils/util";
import { getPermissionsRequestCount } from "./permissions";

export function getNetworkIdentifier(state) {
  const {
    taquin: {
      provider: { type, nickname, rpcTarget },
    },
  } = state;

  return nickname || rpcTarget || type;
}

export function getCurrentKeyring(state) {
  const identity = getSelectedIdentity(state);

  if (!identity) {
    return null;
  }

  const simpleAddress = stripHexPrefix(identity.address).toLowerCase();

  const keyring = state.taquin.keyrings.find((kr) => {
    return (
      kr.accounts.includes(simpleAddress) ||
      kr.accounts.includes(identity.address)
    );
  });

  return keyring;
}

export function getAccountType(state) {
  const currentKeyring = getCurrentKeyring(state);
  const type = currentKeyring && currentKeyring.type;

  switch (type) {
    case "Trezor Hardware":
    case "Ledger Hardware":
      return "hardware";
    case "Simple Key Pair":
      return "imported";
    default:
      return "default";
  }
}

export function getCurrentNetworkId(state) {
  return state.taquin.network;
}

export const getTaquinAccounts = createSelector(
  getTaquinAccountsRaw,
  getTaquinCachedBalances,
  (currentAccounts, cachedBalances) =>
    Object.entries(currentAccounts).reduce(
      (selectedAccounts, [accountID, account]) => {
        if (account.balance === null || account.balance === undefined) {
          return {
            ...selectedAccounts,
            [accountID]: {
              ...account,
              balance: cachedBalances && cachedBalances[accountID],
            },
          };
        }
        return {
          ...selectedAccounts,
          [accountID]: account,
        };
      },
      {}
    )
);

export function getSelectedAddress(state) {
  return state.taquin.selectedAddress;
}

export function getSelectedIdentity(state) {
  const selectedAddress = getSelectedAddress(state);
  const { identities } = state.taquin;

  return identities[selectedAddress];
}

export function getNumberOfAccounts(state) {
  return Object.keys(state.taquin.accounts).length;
}

export function getNumberOfTokens(state) {
  const { tokens } = state.taquin;
  return tokens ? tokens.length : 0;
}

export function getTaquinKeyrings(state) {
  return state.taquin.keyrings;
}

export function getTaquinIdentities(state) {
  return state.taquin.identities;
}

export function getTaquinAccountsRaw(state) {
  return state.taquin.accounts;
}

export function getTaquinCachedBalances(state) {
  const network = getCurrentNetworkId(state);

  return state.taquin.cachedBalances[network];
}

/**
 * Get ordered (by keyrings) accounts with identity and balance
 */
export const getTaquinAccountsOrdered = createSelector(
  getTaquinKeyrings,
  getTaquinIdentities,
  getTaquinAccounts,
  (keyrings, identities, accounts) =>
    keyrings
      .reduce((list, keyring) => list.concat(keyring.accounts), [])
      .filter((address) => Boolean(identities[address]))
      .map((address) => ({ ...identities[address], ...accounts[address] }))
);

export function isBalanceCached(state) {
  const selectedAccountBalance =
    state.taquin.accounts[getSelectedAddress(state)].balance;
  const cachedBalance = getSelectedAccountCachedBalance(state);

  return Boolean(!selectedAccountBalance && cachedBalance);
}

export function getSelectedAccountCachedBalance(state) {
  const cachedBalances = state.taquin.cachedBalances[state.taquin.network];
  const selectedAddress = getSelectedAddress(state);

  return cachedBalances && cachedBalances[selectedAddress];
}

export function getSelectedAccount(state) {
  const accounts = getTaquinAccounts(state);
  const selectedAddress = getSelectedAddress(state);

  return accounts[selectedAddress];
}

export function getTargetAccount(state, targetAddress) {
  const accounts = getTaquinAccounts(state);
  return accounts[targetAddress];
}

export const getTokenExchangeRates = (state) =>
  state.taquin.contractExchangeRates;

export function getAssetImages(state) {
  const assetImages = state.taquin.assetImages || {};
  return assetImages;
}

export function getAddressBook(state) {
  const { network } = state.taquin;
  if (!state.taquin.addressBook[network]) {
    return [];
  }
  return Object.values(state.taquin.addressBook[network]);
}

export function getAddressBookEntry(state, address) {
  const addressBook = getAddressBook(state);
  const entry = addressBook.find(
    (contact) => contact.address === checksumAddress(address)
  );
  return entry;
}

export function getAddressBookEntryName(state, address) {
  const entry =
    getAddressBookEntry(state, address) || state.taquin.identities[address];
  return entry && entry.name !== "" ? entry.name : shortenAddress(address);
}

export function accountsWithSendEtherInfoSelector(state) {
  const accounts = getTaquinAccounts(state);
  const identities = getTaquinIdentities(state);

  const accountsWithSendEtherInfo = Object.entries(identities).map(
    ([key, identity]) => {
      return { ...identity, ...accounts[key] };
    }
  );

  return accountsWithSendEtherInfo;
}

export function getAccountsWithLabels(state) {
  return getTaquinAccountsOrdered(state).map(({ address, name, balance }) => ({
    address,
    addressLabel: `${name} (...${address.slice(address.length - 4)})`,
    label: name,
    balance,
  }));
}

export function getCurrentAccountWithSendEtherInfo(state) {
  const currentAddress = getSelectedAddress(state);
  const accounts = accountsWithSendEtherInfoSelector(state);
  return getAccountByAddress(accounts, currentAddress);
}

export function getTargetAccountWithSendEtherInfo(state, targetAddress) {
  const accounts = accountsWithSendEtherInfoSelector(state);
  return getAccountByAddress(accounts, targetAddress);
}

export function getCurrentEthBalance(state) {
  return getCurrentAccountWithSendEtherInfo(state).balance;
}

export function getGasIsLoading(state) {
  return state.appState.gasIsLoading;
}

export function getCurrentCurrency(state) {
  return state.taquin.currentCurrency;
}

export function getTotalUnapprovedCount(state) {
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
  } = state.taquin;

  return (
    unapprovedMsgCount +
    unapprovedPersonalMsgCount +
    unapprovedDecryptMsgCount +
    unapprovedEncryptionPublicKeyMsgCount +
    unapprovedTypedMessagesCount +
    getUnapprovedTxCount(state) +
    getPermissionsRequestCount(state) +
    getSuggestedTokenCount(state)
  );
}

function getUnapprovedTxCount(state) {
  const { unapprovedTxs = {} } = state.taquin;
  return Object.keys(unapprovedTxs).length;
}

function getSuggestedTokenCount(state) {
  const { suggestedTokens = {} } = state.taquin;
  return Object.keys(suggestedTokens).length;
}

export function getIsMainnet(state) {
  const networkType = getNetworkIdentifier(state);
  return networkType === NETWORK_TYPES.MAINNET;
}

export function isEthereumNetwork(state) {
  const networkType = getNetworkIdentifier(state);
  const { KOVAN, MAINNET, RINKEBY, ROPSTEN, GOERLI } = NETWORK_TYPES;

  return [KOVAN, MAINNET, RINKEBY, ROPSTEN, GOERLI].includes(networkType);
}

export function getPreferences({ taquin }) {
  return taquin.preferences;
}

export function getShouldShowFiat(state) {
  const isMainNet = getIsMainnet(state);
  const { showFiatInTestnets } = getPreferences(state);
  return Boolean(isMainNet || showFiatInTestnets);
}

export function getAdvancedInlineGasShown(state) {
  return Boolean(state.taquin.featureFlags.advancedInlineGas);
}

export function getUseNonceField(state) {
  return Boolean(state.taquin.useNonceField);
}

export function getCustomNonceValue(state) {
  return String(state.taquin.customNonceValue);
}

export function getDomainMetadata(state) {
  return state.taquin.domainMetadata;
}

export const getBackgroundMetaMetricState = (state) => {
  return {
    network: getCurrentNetworkId(state),
    accountType: getAccountType(state),
    metaMetricsId: state.taquin.metaMetricsId,
    numberOfTokens: getNumberOfTokens(state),
    numberOfAccounts: getNumberOfAccounts(state),
    participateInMetaMetrics: state.taquin.participateInMetaMetrics,
  };
};

export function getRpcPrefsForCurrentProvider(state) {
  const { frequentRpcListDetail, provider } = state.taquin;
  const selectRpcInfo = frequentRpcListDetail.find(
    (rpcInfo) => rpcInfo.rpcUrl === provider.rpcTarget
  );
  const { rpcPrefs = {} } = selectRpcInfo || {};
  return rpcPrefs;
}

export function getKnownMethodData(state, data) {
  if (!data) {
    return null;
  }
  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  const { knownMethodData } = state.taquin;

  return knownMethodData && knownMethodData[fourBytePrefix];
}

export function getFeatureFlags(state) {
  return state.taquin.featureFlags;
}

export function getOriginOfCurrentTab(state) {
  return state.activeTab.origin;
}

export function getIpfsGateway(state) {
  return state.taquin.ipfsGateway;
}

export function getCurrentTxPage(state) {
  return state?.taquin?.transactionPagination?.currentPage || 1;
}

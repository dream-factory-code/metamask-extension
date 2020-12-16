import ObservableStore from "obs-store";
import log from "loglevel";
import BN from "bn.js";
import createId from "../lib/random-id";
import { bnToHex } from "../lib/util";
import fetchWithTimeout from "../lib/fetch-with-timeout";
// import { ethAddressToTolarAddress } from "../../../app/scripts/tolar-keyring/tolar-keyring";
// app\scripts\tolar-keyring\tolar-keyring.js";
// import {
//   ROPSTEN,
//   RINKEBY,
//   KOVAN,
//   GOERLI,
//   MAINNET,
//   NETWORK_TYPE_TO_ID_MAP,
// } from './network/enums'

import {
  MAINNET,
  STAGINGNET,
  TESTNET,
  NETWORK_TYPE_TO_SUBDOMAIN_MAP,
} from "./network/enums";
// import Web3 from "@dreamfactoryhr/web3t";
const fetch = fetchWithTimeout({
  timeout: 30000,
});

export default class IncomingTransactionsController {
  constructor(opts = {}) {
    const { blockTracker, networkController, preferencesController } = opts;
    this.blockTracker = blockTracker;
    this.networkController = networkController;
    this.preferencesController = preferencesController;
    this.getCurrentNetwork = () => networkController.getProviderConfig().type;

    this._onLatestBlock = async (latestBlock) => {
      console.log("TONI onLatestBlock ", latestBlock);
      const selectedAddress = this.preferencesController.getSelectedAddress();
      console.log(
        "TONI getSelectedAddress ",
        selectedAddress,
        "add early exit on undefined"
      );
      if (!selectedAddress) return;
      //const newBlockNumberDec = parseInt(latestBlock, 16);
      const { newBlockNumberDec } = latestBlock;
      await this._update({
        address: selectedAddress,
        newBlockNumberDec,
      });
    };

    const initState = {
      incomingTransactions: {},
      incomingTxLastFetchedBlocksByNetwork: {
        // [ROPSTEN]: null,
        // [RINKEBY]: null,
        // [KOVAN]: null,
        // [GOERLI]: null,
        [MAINNET]: null,
        [STAGINGNET]: null,
        [TESTNET]: null,
      },
      ...opts.initState,
    };
    this.store = new ObservableStore(initState);

    this.preferencesController.store.subscribe(
      pairwise((prevState, currState) => {
        const {
          featureFlags: {
            showIncomingTransactions: prevShowIncomingTransactions,
          } = {},
        } = prevState;
        const {
          featureFlags: {
            showIncomingTransactions: currShowIncomingTransactions,
          } = {},
        } = currState;

        if (currShowIncomingTransactions === prevShowIncomingTransactions) {
          return;
        }

        if (prevShowIncomingTransactions && !currShowIncomingTransactions) {
          this.stop();
          return;
        }

        this.start();
      })
    );

    this.preferencesController.store.subscribe(
      pairwise(async (prevState, currState) => {
        const { selectedAddress: prevSelectedAddress } = prevState;
        const { selectedAddress: currSelectedAddress } = currState;

        if (currSelectedAddress === prevSelectedAddress) {
          return;
        }

        await this._update({
          address: currSelectedAddress,
        });
      })
    );

    this.networkController.on("networkDidChange", async (newType) => {
      const address = this.preferencesController.getSelectedAddress();
      await this._update({
        address,
        networkType: newType,
      });
    });
  }

  start() {
    const { featureFlags = {} } = this.preferencesController.store.getState();
    const { showIncomingTransactions } = featureFlags;

    if (!showIncomingTransactions) {
      return;
    }

    this.blockTracker.removeListener("latest", this._onLatestBlock);
    this.blockTracker.addListener("latest", this._onLatestBlock);
  }

  stop() {
    this.blockTracker.removeListener("latest", this._onLatestBlock);
  }

  async _update({ address, newBlockNumberDec, networkType } = {}) {
    try {
      console.log(
        "TONI trying to update",
        address,
        newBlockNumberDec,
        networkType
      );
      const dataForUpdate = await this._getDataForUpdate({
        address,
        newBlockNumberDec,
        networkType,
      });
      await this._updateStateWithNewTxData(dataForUpdate);
    } catch (err) {
      log.error(err);
    }
  }

  async _getDataForUpdate({ address, newBlockNumberDec, networkType } = {}) {
    console.log("TONI data for update", {
      address,
      newBlockNumberDec,
      networkType,
    });
    const {
      incomingTransactions: currentIncomingTxs,
      incomingTxLastFetchedBlocksByNetwork: currentBlocksByNetwork,
    } = this.store.getState();

    const network = networkType || this.getCurrentNetwork();
    const lastFetchBlockByCurrentNetwork = currentBlocksByNetwork[network];
    let blockToFetchFrom = lastFetchBlockByCurrentNetwork || newBlockNumberDec;
    if (blockToFetchFrom === undefined) {
      blockToFetchFrom = parseInt(this.blockTracker.getCurrentBlock(), 16);
    }

    const { latestIncomingTxBlockNumber, txs: newTxs } = await this._fetchAll(
      address,
      blockToFetchFrom,
      network
    );

    console.log("TONI data for update", {
      latestIncomingTxBlockNumber,
      newTxs,
      currentIncomingTxs,
      currentBlocksByNetwork,
      fetchedBlockNumber: blockToFetchFrom,
      network,
    });
    return {
      latestIncomingTxBlockNumber,
      newTxs,
      currentIncomingTxs,
      currentBlocksByNetwork,
      fetchedBlockNumber: blockToFetchFrom,
      network,
    };
  }

  async _updateStateWithNewTxData({
    latestIncomingTxBlockNumber,
    newTxs,
    currentIncomingTxs,
    currentBlocksByNetwork,
    fetchedBlockNumber,
    network,
  }) {
    const newLatestBlockHashByNetwork = latestIncomingTxBlockNumber
      ? parseInt(latestIncomingTxBlockNumber, 10) + 1
      : fetchedBlockNumber + 1;
    const newIncomingTransactions = {
      ...currentIncomingTxs,
    };
    newTxs.forEach((tx) => {
      newIncomingTransactions[tx.hash] = tx;
    });

    this.store.updateState({
      incomingTxLastFetchedBlocksByNetwork: {
        ...currentBlocksByNetwork,
        [network]: newLatestBlockHashByNetwork,
      },
      incomingTransactions: newIncomingTransactions,
    });
  }

  async _fetchAll(address, fromBlock, networkType) {
    const fetchedTxResponse = await this._fetchTxs(
      address,
      fromBlock,
      networkType
    );
    return this._processTxFetchResponse(fetchedTxResponse);
  }

  async _fetchTxs(address, fromBlock, networkType) {
    // TODO TONI EARLY EXIT FOR DISABLE
    return {};
    // let etherscanSubdomain = 'api'
    let subdomain = NETWORK_TYPE_TO_SUBDOMAIN_MAP[MAINNET]?.subdomain;
    // const currentNetworkID = NETWORK_TYPE_TO_ID_MAP[networkType]?.networkId
    //    const currentNetworkID = NETWORK_TYPE_TO_SUBDOMAIN_MAP[networkType]?.subdomain
    const currentNetworkSubdomain =
      NETWORK_TYPE_TO_SUBDOMAIN_MAP[networkType]?.subdomain;

    // if (!currentNetworkID) {
    if (!currentNetworkSubdomain) {
      return {};
    }

    if (networkType !== MAINNET) {
      // etherscanSubdomain = `api-${networkType}`
      subdomain = currentNetworkSubdomain;
    }
    console.log(
      "TONI TODO: get transaction list for who?",
      subdomain,
      "\n address:",
      address
    );
    // const apiUrl = `https://${etherscanSubdomain}.etherscan.io`
    const apiUrl = `https://${subdomain}.dream-factory.hr`;
    let _web3 = new Web3(apiUrl);
    const tolarAddress = ethAddressToTolarAddress(address);

    const result = await _web3.tolar.getTransactionList(
      (tolarAddress && [
        tolarAddress,
        "5493b8597964a2a7f0c93c49f9e4c4a170e0c42a5eb3beda0d", // TODO TONI: remove this address from here
      ]) ||
        [],
      10,
      0
    );

    console.log(
      "TONI TODO replace url with get transaction list for address",
      result
    );
    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;

    if (fromBlock) {
      url += `&startBlock=${parseInt(fromBlock, 10)}`;
    }
    //TONI TODO removed api call, replace it with right one
    // const response = await fetch(url)
    const response = {}; //await fetch(apiUrl)
    const parsedResponse = {
      status: "1",
      result: result.transactions,
      address,
      tolarAddress,
    }; //await response.json()

    return {
      ...parsedResponse,
      address,
      tolarAddress,
      // currentNetworkID,
      currentNetworkSubdomain,
    };
  }

  _processTxFetchResponse({ status, result = [], address, currentNetworkID }) {
    console.log("incomingTx", status, result);
    if (status === "1" && Array.isArray(result) && result.length > 0) {
      const remoteTxList = {};
      const remoteTxs = [];
      result.forEach((tx) => {
        if (!remoteTxList[tx.transaction_hash]) {
          remoteTxs.push(this._normalizeTxFromEtherscan(tx, currentNetworkID));
          remoteTxList[tx.transaction_hash] = 1;
        }
      });
      console.log("incomingTx remoteTxs", remoteTxs);
      const incomingTxs = remoteTxs.filter(
        (tx) =>
          (tx.receiver_address &&
            tx.receiver_address.toLowerCase() === address.toLowerCase()) ||
          tx.sender_address.toLowerCase() ===
            "5493b8597964a2a7f0c93c49f9e4c4a170e0c42a5eb3beda0d".toLowerCase() // TODO TONI remove second part of filter cb
      );
      incomingTxs.sort((a, b) =>
        a.confirmation_timestamp < b.confirmation_timestamp ? -1 : 1
      );

      let latestIncomingTxBlockNumber = null;
      //TONI TODO: check if this needs to be revisited
      // incomingTxs.forEach((tx) => {
      //   if (
      //     tx.blockNumber &&
      //     (!latestIncomingTxBlockNumber ||
      //       parseInt(latestIncomingTxBlockNumber, 10) <
      //         parseInt(tx.blockNumber, 10))
      //   ) {
      //     latestIncomingTxBlockNumber = tx.blockNumber;
      //   }
      // });
      console.log("incomingTxs", incomingTxs);
      return {
        latestIncomingTxBlockNumber,
        txs: incomingTxs,
      };
    }
    return {
      latestIncomingTxBlockNumber: null,
      txs: [],
    };
  }

  _normalizeTxFromEtherscan(txMeta, currentNetworkID) {
    console.log("incomingTx normalize", txMeta, currentNetworkID);

    const time = txMeta.confirmation_timestamp;
    const status = txMeta.isError === "0" ? "confirmed" : "failed";
    return {
      ...txMeta,
      blockNumber: txMeta.block_hash, // TONI TODO txMeta.blockNumber,
      id: createId(),
      metamaskNetworkId: currentNetworkID, // TONI TODO replace metamaskName here
      status,
      time,
      txParams: {
        from: txMeta.sender_address,
        gas: bnToHex(new BN(txMeta.gas)),
        gasPrice: bnToHex(new BN(txMeta.gas_price)),
        nonce: bnToHex(new BN(txMeta.nonce)),
        to: txMeta.receiver_address,
        value: bnToHex(new BN(txMeta.value + "")),
      },
      hash: txMeta.transaction_hash,
      transactionCategory: "incoming",
    };
  }
}

function pairwise(fn) {
  let first = true;
  let cache;
  return (value) => {
    try {
      if (first) {
        first = false;
        return fn(value, value);
      }
      return fn(cache, value);
    } finally {
      cache = value;
    }
  };
}

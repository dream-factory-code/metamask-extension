import ObservableStore from "obs-store";
import log from "loglevel";
import BN from "bn.js";
import createId from "../lib/random-id";
import { bnToHex } from "../lib/util";
import fetchWithTimeout from "../lib/fetch-with-timeout";

import {
  MAINNET,
  TESTNET,
  NETWORK_TYPE_TO_SUBDOMAIN_MAP,
} from "./network/enums";
const fetch = fetchWithTimeout({
  timeout: 30000,
});

export default class IncomingTransactionsController {
  constructor(opts = {}) {
    const {
      blockTracker,
      networkController,
      preferencesController,
      web3,
    } = opts;
    this.blockTracker = blockTracker;
    this.networkController = networkController;
    this.preferencesController = preferencesController;
    this.web3 = web3;
    this.pagination = {
      page: 1,
      pageSize: 5,
      isLoading: false,
    };
    this.selectedAddress = null;

    this.getCurrentNetwork = () => networkController.getProviderConfig().type;

    this._onLatestBlock = async (latestBlock) => {
      const selectedAddress = this.preferencesController.getSelectedAddress();

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
      this.pagination = {
        page: 1,
        pageSize: 5,
        isLoading: false,
      };
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

    const { txs: newTxs } = await this._fetchAll(
      address,
      blockToFetchFrom,
      network
    );

    return {
      newTxs,
      currentIncomingTxs,
      currentBlocksByNetwork,
      fetchedBlockNumber: blockToFetchFrom,
      network,
    };
  }

  async _updateStateWithNewTxData({
    newTxs,
    currentIncomingTxs,
    currentBlocksByNetwork,
    fetchedBlockNumber,
    network,
  }) {
    const newFetchedTransactions = {
      // ...currentIncomingTxs,
    };
    newTxs.forEach((tx) => {
      newFetchedTransactions[tx.hash] = {
        ...tx,
        network,
        page: this.pagination.page,
      };
    });

    this.pagination.isLoading = false;
    this.store.updateState({
      incomingTransactions: newFetchedTransactions,
      incomingTransactionsPagination: this.pagination,
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
    // TODO changing urls
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

    // const apiUrl = `https://${etherscanSubdomain}.etherscan.io`
    // const apiUrl = `https://${subdomain}.tolar.io`;
    // let _web3 = new Web3(apiUrl);
    // const tolarAddress = ethAddressToTolarAddress(address);
    const result = await this.web3.tolar.getTransactionList(
      [address],
      this.pagination.pageSize,
      (this.pagination.page - 1) * this.pagination.pageSize
    );

    const parsedResponse = {
      status: "1",
      result: result.transactions,
      address,
    }; //await response.json()

    return {
      ...parsedResponse,
      address,
      address,
      // currentNetworkID,
      //currentNetworkSubdomain,
    };
  }

  _processTxFetchResponse({ status, result = [], address, currentNetworkID }) {
    if (status === "1" && Array.isArray(result) && result.length > 0) {
      const remoteTxList = {};
      const remoteTxs = [];
      result.forEach((tx) => {
        if (!remoteTxList[tx.transaction_hash]) {
          remoteTxs.push(this._normalizeTxFromTolar(tx, currentNetworkID));
          remoteTxList[tx.transaction_hash] = 1;
        }
      });
      const incomingTxs = remoteTxs;
      // .filter(
      //   (tx) =>
      //     (tx.receiver_address &&
      //       tx.receiver_address.toLowerCase() === address.toLowerCase()) ||
      //     (tx.sender_address &&
      //       tx.sender_address.toLowerCase() === address.toLowerCase())
      // );
      incomingTxs.sort((a, b) =>
        a.confirmation_timestamp < b.confirmation_timestamp ? 1 : -1
      );

      let latestIncomingTxBlockNumber = null;

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

  async paginate(page) {
    this.pagination.page = page;
    const address = this.preferencesController.getSelectedAddress();
    this.pagination.isLoading = true;
    this.store.updateState({
      incomingTransactionsPagination: this.pagination,
    });
    await this._update({
      address,
    });
  }

  _normalizeTxFromTolar(txMeta, currentNetworkID) {
    const time = txMeta.confirmation_timestamp;
    const status = txMeta.transaction_hash ? "confirmed" : "failed";
    return {
      ...txMeta,
      blockNumber: txMeta.block_hash,
      id: createId(),
      metamaskNetworkId: currentNetworkID,
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

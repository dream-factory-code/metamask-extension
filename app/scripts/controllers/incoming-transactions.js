import ObservableStore from "obs-store";
import log from "loglevel";
import BN from "bn.js";
import createId from "../lib/random-id";
import { bnToHex } from "../lib/util";
import fetchWithTimeout from "../lib/fetch-with-timeout";

import {
  MAINNET,
  STAGINGNET,
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
      console.log("TONI onLatestBlock ", latestBlock);
      const selectedAddress = this.preferencesController.getSelectedAddress();
      console.log(
        "TONI getSelectedAddress ",
        selectedAddress,
        this.selectedAddress,
        "add early exit on undefined"
      );
      if (!selectedAddress) return;
      //const newBlockNumberDec = parseInt(latestBlock, 16);
      const { newBlockNumberDec } = latestBlock;
      console.log(
        "toni debug update, receive signal here from ui, on latest block"
      );
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
        console.log(
          "toni debug update, receive signal here from ui, preferences store update"
        );
        this.pagination = {
          page: 1,
          pageSize: 5,
          isLoading: false,
        };
        await this._update({
          address: currSelectedAddress,
        });
      })
    );

    this.networkController.on("networkDidChange", async (newType) => {
      console.log(
        "toni debug update, receive signal here from ui, network did change"
      );
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

    const { txs: newTxs } = await this._fetchAll(
      address,
      blockToFetchFrom,
      network
    );

    console.log("TONI data for update", {
      newTxs,
      currentIncomingTxs,
      currentBlocksByNetwork,
      fetchedBlockNumber: blockToFetchFrom,
      network,
    });
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
    console.log("TONI update state with new Tx data", {
      newTxs,
      currentIncomingTxs,
      currentBlocksByNetwork,
      fetchedBlockNumber,
      network,
    });

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

    console.log("TONI update state with new Tx data state data", {
      fetchedTransactions: newFetchedTransactions,
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
    // // TODO TONI EARLY EXIT FOR DISABLE
    // return {};
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
    // const apiUrl = `https://${subdomain}.dream-factory.hr`;
    // let _web3 = new Web3(apiUrl);
    // const tolarAddress = ethAddressToTolarAddress(address);
    console.log("TONI get data for pagination here", this.pagination.page);
    const result = await this.web3.tolar.getTransactionList(
      [address],
      this.pagination.pageSize,
      (this.pagination.page - 1) * this.pagination.pageSize
    );

    // console.log(
    //   "TONI TODO replace url with get transaction list for address",
    //   result
    // );
    // let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;

    // if (fromBlock) {
    //   url += `&startBlock=${parseInt(fromBlock, 10)}`;
    // }
    //TONI TODO removed api call, replace it with right one
    // const response = await fetch(url)
    // const response = {}; //await fetch(apiUrl)
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
    console.log("incomingTx", status, result, address);
    if (status === "1" && Array.isArray(result) && result.length > 0) {
      const remoteTxList = {};
      const remoteTxs = [];
      result.forEach((tx) => {
        if (!remoteTxList[tx.transaction_hash]) {
          remoteTxs.push(this._normalizeTxFromTolar(tx, currentNetworkID));
          remoteTxList[tx.transaction_hash] = 1;
        }
      });
      console.log("incomingTx remoteTxs", remoteTxs, address);
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

  async paginate(page) {
    this.pagination.page = page;
    console.log("TODO toni call pagination on page", this.pagination);
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
    console.log("incomingTx normalize", txMeta, currentNetworkID);

    const time = txMeta.confirmation_timestamp;
    // const status = txMeta.isError === "0" ? "confirmed" : "failed";
    const status = txMeta.transaction_hash ? "confirmed" : "failed";
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

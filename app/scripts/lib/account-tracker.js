/* Account Tracker
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

import EthQuery from "eth-query";

import ObservableStore from "obs-store";
import log from "loglevel";
import pify from "pify";
//import Web3 from 'web3'
// import Web3 from "@dreamfactoryhr/web3t";

// import SINGLE_CALL_BALANCES_ABI from "single-call-balance-checker-abi";
// import {
//   MAINNET,
//   STAGINGNET,
//   TESTNET,
//   // MAINNET_NETWORK_ID,
//   // RINKEBY_NETWORK_ID,
//   // ROPSTEN_NETWORK_ID,
//   // KOVAN_NETWORK_ID,
// } from "../controllers/network/enums";

import // SINGLE_CALL_BALANCES_ADDRESS,
// SINGLE_CALL_BALANCES_ADDRESS_RINKEBY,
// SINGLE_CALL_BALANCES_ADDRESS_ROPSTEN,
// SINGLE_CALL_BALANCES_ADDRESS_KOVAN,
"../controllers/network/contract-addresses";
import { bnToHex } from "./util";
// import { ethAddressToTolarAddress } from "../tolar-keyring/tolar-keyring";

export default class AccountTracker {
  /**
   * This module is responsible for tracking any number of accounts and caching their current balances & transaction
   * counts.
   *
   * It also tracks transaction hashes, and checks their inclusion status on each new block.
   *
   * @typedef {Object} AccountTracker
   * @param {Object} opts - Initialize various properties of the class.
   * @property {Object} store The stored object containing all accounts to track, as well as the current block's gas limit.
   * @property {Object} store.accounts The accounts currently stored in this AccountTracker
   * @property {string} store.currentBlockGasLimit A hex string indicating the gas limit of the current block
   * @property {Object} _provider A provider needed to create the EthQuery instance used within this AccountTracker.
   * @property {EthQuery} _query An EthQuery instance used to access account information from the blockchain
   * @property {BlockTracker} _blockTracker A BlockTracker instance. Needed to ensure that accounts and their info updates
   * when a new block is created.
   * @property {Object} _currentBlockNumber Reference to a property on the _blockTracker: the number (i.e. an id) of the the current block
   *
   */
  constructor(opts = {}) {
    const initState = {
      accounts: {},
      currentBlockGasLimit: "",
    };
    this.store = new ObservableStore(initState);

    this._provider = opts.provider;
    this._query = pify(new EthQuery(this._provider));
    this._blockTracker = opts.blockTracker;
    // blockTracker.currentBlock may be null
    this._currentBlockNumber = this._blockTracker.getCurrentBlock();
    this._blockTracker.once("latest", (blockNumber) => {
      this._currentBlockNumber = blockNumber;
    });

    // bind function for easier listener syntax
    this._updateForBlock = this._updateForBlock.bind(this);
    this.network = opts.network;

    this.web3 = opts.web3;
  }

  start() {
    // remove first to avoid double add
    this._blockTracker.removeListener("latest", this._updateForBlock);
    // add listener
    this._blockTracker.addListener("latest", this._updateForBlock);
    console.log("TONI debug paste blockTracker start", arguments);

    // fetch account balances
    this._updateAccounts();
  }

  stop() {
    // remove listener
    this._blockTracker.removeListener("latest", this._updateForBlock);
  }

  /**
   * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
   * AccountTracker.
   *
   * Once this AccountTracker's accounts are up to date with those referenced by the passed addresses, each
   * of these accounts are given an updated balance via EthQuery.
   *
   * @param {array} address - The array of hex addresses for accounts with which this AccountTracker's accounts should be
   * in sync
   *
   */
  syncWithAddresses(addresses) {
    const { accounts } = this.store.getState();
    const locals = Object.keys(accounts);
    const accountsToAdd = [];
    addresses.forEach((upstream) => {
      if (!locals.includes(upstream)) {
        accountsToAdd.push(upstream);
      }
    });

    const accountsToRemove = [];
    locals.forEach((local) => {
      if (!addresses.includes(local)) {
        accountsToRemove.push(local);
      }
    });

    console.log("TONI debug account infinite loop", {
      addresses,
      locals,
      accountsToAdd,
    });
    this.addAccounts(accountsToAdd);
    this.removeAccount(accountsToRemove);
  }

  /**
   * Adds new addresses to track the balances of
   * given a balance as long this._currentBlockNumber is defined.
   *
   * @param {array} addresses - An array of hex addresses of new accounts to track
   *
   */
  addAccounts(addresses) {
    const { accounts } = this.store.getState();
    // add initial state for addresses
    addresses.forEach((address) => {
      accounts[address] = {};
    });
    // save accounts state
    this.store.updateState({ accounts });
    // fetch balances for the accounts if there is block number ready
    if (!this._currentBlockNumber) {
      return;
    }
    this._updateAccounts();
  }

  /**
   * Removes accounts from being tracked
   *
   * @param {array} an - array of hex addresses to stop tracking
   *
   */
  removeAccount(addresses) {
    const { accounts } = this.store.getState();
    // remove each state object
    addresses.forEach((address) => {
      delete accounts[address];
    });
    // save accounts state
    this.store.updateState({ accounts });
  }

  /**
   * Removes all addresses and associated balances
   */

  clearAccounts() {
    this.store.updateState({ accounts: {} });
  }

  /**
   * Given a block, updates this AccountTracker's currentBlockGasLimit, and then updates each local account's balance
   * via EthQuery
   *
   * @private
   * @param {number} block - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   *
   */
  async _updateForBlock(block) {
    this._currentBlockNumber = block;
    console.log("TONI debug, should be blockNumber not block object", block);
    // block gasLimit polling shouldn't be in account-tracker shouldn't be here...
    // const currentBlock = await this._query.getBlockByNumber(blockNumber, false);
    const { block_index } = block;
    // TODO Toni uncomment this when staging is fixed:
    const currentBlock = await this.web3.tolar.getBlockByIndex(block_index);
    console.log("TONI web3.tolar.getBlockByIndex", block, currentBlock);
    if (!currentBlock) {
      return;
    }
    const currentBlockGasLimit = currentBlock.gasLimit;
    this.store.updateState({ currentBlockGasLimit });

    try {
      await this._updateAccounts();
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * balanceChecker is deployed on main eth (test)nets and requires a single call
   * for all other networks, calls this._updateAccount for each account in this.store
   *
   * @returns {Promise} - after all account balances updated
   *
   */
  async _updateAccounts() {
    const { accounts } = this.store.getState();
    const addresses = Object.keys(accounts);
    const currentNetwork = this.network.getNetworkState();
    console.log("TONI this.network.getNetworkState(), accounts", {
      currentNetwork,
      accounts,
    });
    switch (currentNetwork) {
      // case MAINNET_NETWORK_ID.toString():
      //   await this._updateAccountsViaBalanceChecker(addresses, SINGLE_CALL_BALANCES_ADDRESS)
      //   break

      // case RINKEBY_NETWORK_ID.toString():
      //   await this._updateAccountsViaBalanceChecker(addresses, SINGLE_CALL_BALANCES_ADDRESS_RINKEBY)
      //   break

      // case ROPSTEN_NETWORK_ID.toString():
      //   await this._updateAccountsViaBalanceChecker(addresses, SINGLE_CALL_BALANCES_ADDRESS_ROPSTEN)
      //   break

      // case KOVAN_NETWORK_ID.toString():
      //   await this._updateAccountsViaBalanceChecker(addresses, SINGLE_CALL_BALANCES_ADDRESS_KOVAN)
      //   break

      default:
        await Promise.all(addresses.map(this._updateAccount.bind(this)));
    }
  }

  /**
   * Updates the current balance of an account.
   *
   * @private
   * @param {string} address - A hex address of a the account to be updated
   * @returns {Promise} - after the account balance is updated
   *
   */
  async _updateAccount(address) {
    // query balance
    if (!/^54/.test(address)) return;
    console.log("toni debug account", this._currentBlockNumber, { address });
    const blockCount =
      this._currentBlockNumber.block_index ||
      (await this.web3.tolar.getBlockCount());
    //const tolarAddress = ethAddressToTolarAddress(address);
    const { balance } = await this.web3.tolar.getBalance(
      address,
      blockCount - 1
    );
    // TODO TONI CLEANUP
    // const { balance } = await this._query.sendAsync({
    //   method: "tol_getLatestBalance",
    //   params: [address],
    // });
    //await this._query.getBalance(address);
    const result = { address, balance /*, tolarAddress*/ };
    // update accounts state
    const { accounts, ...state } = this.store.getState();
    console.log(
      "toni debug address, balance",
      { address /*, tolarAddress*/ },
      { balance },
      { state }
    );
    // only populate if the entry is still present
    if (!accounts[address]) {
      return;
    }
    accounts[address] = result;

    this.store.updateState({ accounts });
  }

  /**
   * Updates current address balances from balanceChecker deployed contract instance
   * @param {*} addresses
   * @param {*} deployedContractAddress
   */
  async _updateAccountsViaBalanceChecker(addresses, deployedContractAddress) {
    const { accounts } = this.store.getState();
    // this.web3.setProvider(this._provider);

    // const ethContract = this.web3.eth.contract(SINGLE_CALL_BALANCES_ABI).at(deployedContractAddress)
    // const ethBalance = ['0x0']

    ethContract.balances(addresses, ethBalance, (error, result) => {
      if (error) {
        log.warn(
          `MetaMask - Account Tracker single call balance fetch failed`,
          error
        );
        Promise.all(addresses.map(this._updateAccount.bind(this)));
        return;
      }
      addresses.forEach((address, index) => {
        const balance = bnToHex(result[index]);
        accounts[address] = { address, balance };
      });
      this.store.updateState({ accounts });
    });
  }
}

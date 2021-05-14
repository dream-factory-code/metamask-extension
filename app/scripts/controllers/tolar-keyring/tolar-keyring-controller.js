import bip39 from "bip39";
import KeyringController from "eth-keyring-controller";
import { TolarSimpleKeyring as SimpleKeyring } from "../tolar-simple-keyring/tolar-simple-keyring";
const HdKeyring = require("eth-hd-keyring");

const { normalize: normalizeAddress } = require("eth-sig-util");
const keyringTypes = [SimpleKeyring, HdKeyring];
export class TolarKeyringController extends KeyringController {
  constructor(opts) {
    super(opts);
    this.keyringTypes = opts.keyringTypes
      ? keyringTypes.concat(opts.keyringTypes)
      : keyringTypes;
    this.web3 = opts.web3;
  }

  createFirstKeyTree() {
    this.clearKeyrings();
    return this.addNewKeyring("Tolar Keyring", { numberOfAccounts: 1 })
      .then((keyring) => {
        return keyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error("KeyringController - No account found on keychain.1");
        }
        const hexAccount = /^54/.test(firstAccount)
          ? firstAccount
          : normalizeAddress(firstAccount);
        this.emit("newVault", hexAccount);
        return null;
      });
  }

  async getAccounts() {
    const keyrings = this.keyrings || [];
    const addrs = await Promise.all(
      keyrings.map((kr) => kr.getAccounts())
    ).then((keyringArrays) => {
      return keyringArrays.reduce((res, arr) => {
        return res.concat(arr);
      }, []);
    });
    // TODO CLEANUP remove normalize for tolar only and improve testing for tolar addresses
    return addrs.map((address) =>
      /^54/.test(address) ? address : normalizeAddress(address)
    );
  }

  signTransaction(ethTx, _fromAddress, opts = {}) {
    const fromAddress = /^54/.test(_fromAddress)
      ? _fromAddress
      : normalizeAddress(_fromAddress);
    return this.getKeyringForAccount(fromAddress).then((keyring) => {
      return keyring.signTransaction(fromAddress, ethTx, opts);
    });
  }

  exportAccount(address) {
    try {
      return this.getKeyringForAccount(address).then((keyring) => {
        return keyring.exportAccount(
          /^54/.test(address) ? address : normalizeAddress(address)
        );
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getAppKeyAddress(_address, origin) {
    const address = /^54/.test(_address)
      ? _address
      : normalizeAddress(_address);

    const keyring = await this.getKeyringForAccount(address);
    return keyring.getAppKeyAddress(address, origin);
  }

  removeAccount(address) {
    return this.getKeyringForAccount(address)
      .then((keyring) => {
        // Not all the keyrings support this, so we have to check
        if (typeof keyring.removeAccount === "function") {
          keyring.removeAccount(address);
          this.emit("removedAccount", address);
          return keyring.getAccounts();
        }
        return Promise.reject(
          new Error(
            `Keyring ${keyring.type} doesn't support account removal operations`
          )
        );
      })
      .then((accounts) => {
        // Check if this was the last/only account
        if (accounts.length === 0) {
          return this.removeEmptyKeyrings();
        }
        return undefined;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this._updateMemStoreKeyrings.bind(this))
      .then(this.fullUpdate.bind(this))
      .catch((e) => {
        return Promise.reject(e);
      });
  }

  getKeyringForAccount(address) {
    // const hexed = /^54/.test(address) ? address : normalizeAddress(address);

    // log.debug(`KeyringController - getKeyringForAccount: ${hexed}`);

    return Promise.all(
      this.keyrings.map((keyring) => {
        return Promise.all([keyring, keyring.getAccounts()]);
      })
    ).then((candidates) => {
      const winners = candidates.filter((candidate) => {
        const accounts = candidate[1];
        return accounts.includes(address);
      });
      if (winners && winners.length > 0) {
        return winners[0][0];
      }
      throw new Error("No keyring found for the requested account.");
    });
  }

  displayForKeyring(keyring) {
    return keyring.getAccounts().then((accounts) => {
      return {
        type: keyring.type,
        accounts: accounts.map((_address) =>
          /^54/.test(_address) ? _address : normalizeAddress(_address)
        ),
      };
    });
  }

  createNewVaultAndRestore(password, seed) {
    if (typeof password !== "string") {
      return Promise.reject(new Error("Password must be text."));
    }
    if (!bip39.validateMnemonic(seed)) {
      return Promise.reject(new Error("Seed phrase is invalid."));
    }

    this.clearKeyrings();

    return this.persistAllKeyrings(password)
      .then(() => {
        return this.addNewKeyring("Tolar Keyring", {
          mnemonic: seed,
          numberOfAccounts: 1,
        });
      })
      .then((firstKeyring) => {
        return firstKeyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error("KeyringController - First Account not found.");
        }
        return null;
      })
      .then(this.persistAllKeyrings.bind(this, password))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this));
  }

  createNewVaultAndKeychain(password) {
    return this.persistAllKeyrings(password)
      .then(this.createFirstKeyTree.bind(this))
      .then(this.persistAllKeyrings.bind(this, password))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this));
  }

  fullUpdate() {
    this.emit("update", this.memStore.getState());
    return this.memStore.getState();
  }
}

import Web3 from "@dreamfactoryhr/web3t";

const HdKeyring = require("eth-hd-keyring");
var utils = require("web3-utils");

const bip39 = require("bip39");

const Wallet = require("ethereumjs-wallet");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

const type = "Tolar Keyring";
const hdPathString = `m/44'/60'/0'/0`;

export default class TolarKeyring extends HdKeyring {
  /* PUBLIC METHODS */

  constructor(opts) {
    super(opts);
    this.web3 = new Web3("https://testnet-gateway.dev.tolar.io");

    this.type = type;

    this.deserialize(opts);
  }

  deserialize(opts = {}) {
    this.opts = opts || {};
    this.wallets = [];
    this.mnemonic = null;
    this.root = null;
    this.hdPath = opts.hdPath || hdPathString;

    if (opts.mnemonic) {
      this._initFromMnemonic(opts.mnemonic);
    }

    if (opts.numberOfAccounts) {
      return this.addAccounts(opts.numberOfAccounts);
    }

    return Promise.resolve([]);
  }

  addAccounts(numberOfAccounts = 1) {
    if (!this.root) {
      this._initFromMnemonic(bip39.generateMnemonic());
    }
    const oldLen = this.wallets.length;
    const newWallets = [];
    for (let i = oldLen; i < numberOfAccounts + oldLen; i++) {
      const child = this.root.deriveChild(i);
      const wallet = child.getWallet();
      wallet.tolarAddress = ethAddressToTolarAddress(
        sigUtil.normalize(wallet.getAddress().toString("hex"))
      );
      newWallets.push(wallet);
      this.wallets.push(wallet);
    }
    const hexWallets = newWallets.map((w) => {
      // check if this removes infinite loop on account creation
      return w.getAddress().toString("hex");
    });
    return Promise.resolve(hexWallets);
  }

  getAccounts() {
    return Promise.resolve(
      this.wallets.map((w) => {
        return ethAddressToTolarAddress(
          sigUtil.normalize(w.getAddress().toString("hex"))
        );
      })
    );
  }

  // tx is an instance of the ethereumjs-transaction class.

  async signTransaction(address, tx, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    const nonce = await this.web3.tolar.getNonce(address);
    const signedTx = await this.web3.tolar.accounts.signTransaction(
      { ...tx, nonce: nonce },
      wallet.getPrivateKeyString()
    );

    return signedTx;
  }

  // // For personal_sign, we need to prefix the message:
  signPersonalMessage(address, msgHex, opts = {}) {
    const privKey = this.getPrivateKeyFor(address, opts);
    const privKeyBuffer = new Buffer(privKey, "hex");
    const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex });
    return Promise.resolve(sig);
  }

  _getWalletForAccount(account, opts = {}) {
    const address = /^54/.test(account) ? account : sigUtil.normalize(account);
    let wallet = this.wallets.find(
      (w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) ===
        address
    );
    if (!wallet)
      throw new Error("Simple Keyring - Unable to find matching address.");

    if (opts.withAppKeyOrigin) {
      const privKey = wallet.getPrivateKey();
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, "utf8");
      const appKeyBuffer = Buffer.concat([privKey, appKeyOriginBuffer]);
      const appKeyPrivKey = ethUtil.keccak(appKeyBuffer, 256);
      wallet = Wallet.fromPrivateKey(appKeyPrivKey);
    }

    return wallet;
  }
}

export const ethAddressToTolarAddress = (ethAddress) => {
  if (!ethAddress) return;
  const prefix = "T";
  const prefixHex = utils.toHex(prefix).substr(2);

  const addressHash = utils.soliditySha3(ethAddress);
  const hashOfHash = utils.soliditySha3(addressHash);
  const tolarAddress =
    prefixHex + ethAddress.substr(2) + hashOfHash.substr(hashOfHash.length - 8);
  return tolarAddress.toLowerCase();
};
TolarKeyring.type = type;

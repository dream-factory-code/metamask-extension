import { ethAddressToTolarAddress } from "../../tolar-keyring/tolar-keyring";
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");
// const Account = require("eth-lib/lib/account");
// const elliptic = require("elliptic");
// const secp256k1 = new elliptic.ec("secp256k1");
const SimpleKeyring = require("eth-simple-keyring");
import Web3 from "@dreamfactoryhr/web3t";

export class TolarSimpleKeyring extends SimpleKeyring {
  constructor(opts) {
    super(opts);
    this.web3 = new Web3("https://tolar-test.tolar.io");
    // const fromPrivateFn = Account.fromPrivate;
    // const recoverFn = Account.recover;
    // Object.assign(Account, {
    //   publicKey: (privateKey) => {
    //     var buffer = Buffer.from(privateKey.slice(2), "hex");
    //     var ecKey = secp256k1.keyFromPrivate(buffer);
    //     return ecKey.getPublic(false, "hex").slice(2);
    //   },
    //   sign: Account.makeSigner(0), // v=27|28 instead of 0|1...;
    //   fromPrivate: (privateKey) => {
    //     const res = fromPrivateFn(privateKey);
    //     return Object.assign(res, {
    //       address: ethAddressToTolarAddress(res.address),
    //     });
    //   },
    //   recover: (hash, signature) =>
    //     ethAddressToTolarAddress(recoverFn(hash, signature)),
    // });
  }

  getAccounts() {
    return Promise.resolve(
      this.wallets.map((w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress()))
      )
    );
  }

  removeAccount(address) {
    if (
      !this.wallets.find(
        (w) =>
          ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) ===
          address
      )
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(
      (w) =>
        ethAddressToTolarAddress(ethUtil.bufferToHex(w.getAddress())) !==
        address
    );

    this.wallets = this.wallets.filter((w) => {
      const tolarAddress = ethAddressToTolarAddress(
        ethUtil.bufferToHex(w.getAddress())
      );

      return tolarAddress !== address.toLowerCase();
    });
  }

  async signTransaction(address, tx, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    const nonce = await this.web3.tolar.getNonce(address);
    const signedTx = await this.web3.tolar.accounts.signTransaction(
      { ...tx, nonce: nonce },
      wallet.getPrivateKeyString()
    );

    return signedTx;
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

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
    this.web3 = new Web3("https://tolar-test.dream-factory.hr");
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

  async signTransaction(address, tx, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    const nonce = await this.web3.tolar.getNonce(address);
    const signedTx = await this.web3.tolar.accounts.signTransaction(
      { ...tx, nonce: nonce },
      wallet.getPrivateKeyString()
    );

    console.log("TONi debug sign", address, tx, opts, this, signedTx);

    // this.sign(privKey);
    // return Promise.resolve(tx);
    return signedTx;
  }

  //   signTolarTx(data, privateKey) {
  //     if (!privateKey.startsWith("0x")) {
  //         privateKey = "0x" + privateKey;
  //     }

  //     // 64 hex characters + hex-prefix
  //     if (privateKey.length !== 66) {
  //         throw new Error("Private key must be 32 bytes long");
  //     }

  //     const hash = data; //this.hashMessage(data);
  //     const signature = Account.sign(hash, privateKey);
  //     const vrs = Account.decodeSignature(signature);
  //     return {
  //         message: data,
  //         messageHash: hash,
  //         v: vrs[0],
  //         r: vrs[1],
  //         s: vrs[2],
  //         signature: signature,
  //         signer_id: Account.publicKey(privateKey),
  //     };
  // };

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

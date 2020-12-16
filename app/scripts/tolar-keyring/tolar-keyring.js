import Web3 from "@dreamfactoryhr/web3t";

const HdKeyring = require("eth-hd-keyring");
var utils = require("web3-utils");

const bip39 = require("bip39");

// import Web3 from "@dreamfactoryhr/web3t";
// TODO TONI: replace latter three imports this with Web3t equivalents
const Wallet = require("ethereumjs-wallet");
const ethUtil = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

const type = "Tolar Keyring";
const hdPathString = `m/44'/60'/0'/0`;

export default class TolarKeyring extends HdKeyring {
  /* PUBLIC METHODS */

  constructor(opts) {
    super(opts);
    this.web3 = new Web3("https://tolar-staging.dream-factory.hr");

    this.type = type;
    console.log("TONI consturcted tolar keyring");
    // this.wallets = []
    // if(opts){
    //   const {numberOfAccounts, privateKeys=[], mnemonic} = opts
    //   this.mnemonic = mnemonic
    //   console.log('TONI tolar keyring construction', {opts})
    //   if(numberOfAccounts) {
    //     this.addAccounts(numberOfAccounts);

    //   }
    //}
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

  // deserialize (opts = {}) {
  //   this.opts = opts || {}
  //   this.wallets = []
  //   this.mnemonic = null
  //   this.root = null
  //   this.hdPath = opts.hdPath || hdPathString

  //   if (opts.mnemonic) {
  //     this._initFromMnemonic(opts.mnemonic)
  //   }

  //   if (opts.numberOfAccounts) {
  //     return this.addAccounts(opts.numberOfAccounts)
  //   }

  //   return Promise.resolve([])
  // }

  // serialize () {
  //   console.log('TONI TolarKeyring serialize');
  //   return Promise.resolve(this.wallets.map(w => w.privateKey))
  // }

  // deserialize (privateKeys = []) {
  //   console.log('TONI TolarKeyring deserialize');
  //   return new Promise((resolve, reject) => {
  //     try {
  //       this.wallets = privateKeys.map((privateKey) => {
  //         const hasHexPrefix = new RegExp(/^0x/, 'i').test(privateKey);
  //         const cleanPrivateKey = hasHexPrefix ? privateKey : `0x${privateKey}`;
  //          const account = this._web3.tolar.accounts.privateKeyToAccount(cleanPrivateKey)

  //         return account
  //       })
  //     } catch (e) {
  //       reject(e)
  //     }
  //     resolve()
  //   })
  // }

  // addAccounts (n = 1) {

  //   const mnemonic = this.mnemonic || bip39.generateMnemonic();

  //   const seed = bip39.mnemonicToSeed(mnemonic)

  //   console.log('TONI TolarKeyring addAccounts');
  //   var newWallets = []
  //   for (var i = 0; i < n; i++) {
  //     const indexBuffer = Buffer.allocUnsafe(4);
  //     indexBuffer.writeUInt32BE(i, 0);
  //     const data = Buffer.concat([seed, indexBuffer])
  //     const seedString = new TextDecoder('utf8').decode(data);
  //     console.log('TONI seedString', seedString)

  //     newWallets.push(this._web3.tolar.accounts.create(seedString))
  //   }
  //   this.wallets = this.wallets.concat(newWallets)
  //   const hexWallets = newWallets.map(w => w.privateKey)
  //   return Promise.resolve(hexWallets)
  // }

  // addAccounts (numberOfAccounts = 1) {
  //   if (!this.root) {
  //     this._initFromMnemonic(bip39.generateMnemonic())
  //   }

  //   const oldLen = this.wallets.length
  //   const newWallets = []
  //   for (let i = oldLen; i < numberOfAccounts + oldLen; i++) {
  //     const child = this.root.deriveChild(i)
  //     const wallet = child.getWallet()
  //     wallet.tolarAddress = ethAddressToTolarAddress(sigUtil.normalize(wallet.getAddress().toString('hex')))
  //     console.log('TONI eth wallet', wallet);
  //     newWallets.push(wallet)
  //     this.wallets.push(wallet);
  //     console.log('TONI, should push to wallets',this.wallets, '\n wallet:', wallet)
  //   }

  //   const hexWallets = newWallets.map((w) => {
  //     console.log('TONI sigUtil normalized wallet',sigUtil.normalize(w.getAddress().toString('hex')))
  //     return ethAddressToTolarAddress( sigUtil.normalize(w.getAddress().toString('hex')))
  //   })
  //   return Promise.resolve(hexWallets)
  // }

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
      //ethAddressToTolarAddress(
      // );
    });
    console.log("TONI eth hd keyring added new account", this);
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
  // getAccounts () {
  //   console.log('TONI TolarKeyring getAccounts');
  //   return Promise.resolve(this.wallets.map(w => w.address))
  // }

  // tx is an instance of the ethereumjs-transaction class.

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

  // // For eth_sign, we need to sign arbitrary data:
  // signMessage (address, data, opts = {}) {
  //   console.log('TONI TolarKeyring sign message', {address, data, opts });
  //   const message = ethUtil.stripHexPrefix(data)
  //   const privKey = this.getPrivateKeyFor(address, opts);
  //   var msgSig = ethUtil.ecsign(new Buffer(message, 'hex'), privKey)
  //   var rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
  //   return Promise.resolve(rawMsgSig)
  // }

  // // For eth_sign, we need to sign transactions:
  // newGethSignMessage (withAccount, msgHex, opts = {}) {
  //   console.log('TONI TolarKeyring newGethSignMessage', {withAccount, msgHex, opts});
  //   const privKey = this.getPrivateKeyFor(withAccount, opts);
  //   const msgBuffer = ethUtil.toBuffer(msgHex)
  //   const msgHash = ethUtil.hashPersonalMessage(msgBuffer)
  //   const msgSig = ethUtil.ecsign(msgHash, privKey)
  //   const rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
  //   return Promise.resolve(rawMsgSig)
  // }

  // // For personal_sign, we need to prefix the message:
  signPersonalMessage(address, msgHex, opts = {}) {
    console.log("TONI TolarKeyring signPersonalMessage", {
      address,
      msgHex,
      opts,
    });
    const privKey = this.getPrivateKeyFor(address, opts);
    const privKeyBuffer = new Buffer(privKey, "hex");
    const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex });
    return Promise.resolve(sig);
  }

  // // For eth_decryptMessage:
  // decryptMessage (withAccount, encryptedData) {
  //   console.log('TONI TolarKeyring decryptMessage', {withAccount, encryptedData});
  //   const wallet = this._getWalletForAccount(withAccount)
  //   const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
  //   const privKeyBuffer = new Buffer(privKey, 'hex')
  //   const sig = sigUtil.decrypt(encryptedData, privKey)
  //   return Promise.resolve(sig)
  // }

  // // personal_signTypedData, signs data along with the schema
  // signTypedData (withAccount, typedData, opts = { version: 'V1' }) {
  //   console.log('TONI TolarKeyring decryptMessage', {withAccount, typedData, opts});
  //   switch (opts.version) {
  //     case 'V1':
  //       return this.signTypedData_v1(withAccount, typedData, opts);
  //     case 'V3':
  //       return this.signTypedData_v3(withAccount, typedData, opts);
  //     case 'V4':
  //       return this.signTypedData_v4(withAccount, typedData, opts);
  //     default:
  //       return this.signTypedData_v1(withAccount, typedData, opts);
  //   }
  // }

  // // personal_signTypedData, signs data along with the schema
  // signTypedData_v1 (withAccount, typedData, opts = {}) {
  //   const privKey = this.getPrivateKeyFor(withAccount, opts);
  //   const sig = sigUtil.signTypedDataLegacy(privKey, { data: typedData })
  //   return Promise.resolve(sig)
  // }

  // // personal_signTypedData, signs data along with the schema
  // signTypedData_v3 (withAccount, typedData, opts = {}) {
  //   const privKey = this.getPrivateKeyFor(withAccount, opts);
  //   const sig = sigUtil.signTypedData(privKey, { data: typedData })
  //   return Promise.resolve(sig)
  // }

  // // personal_signTypedData, signs data along with the schema
  // signTypedData_v4 (withAccount, typedData, opts = {}) {
  //   const privKey = this.getPrivateKeyFor(withAccount, opts);
  //   const sig = sigUtil.signTypedData_v4(privKey, { data: typedData })
  //   return Promise.resolve(sig)
  // }

  // // get public key for nacl
  // getEncryptionPublicKey (withAccount, opts = {}) {
  //   console.log('TONI TolarKeyring getEncryptionPublicKey', {withAccount, opts});
  //   const privKey = this.getPrivateKeyFor(withAccount, opts);
  //   const publicKey = sigUtil.getEncryptionPublicKey(privKey)
  //   return Promise.resolve(publicKey)
  // }

  // getPrivateKeyFor (address, opts = {}) {
  //   console.log('TONI TolarKeyring getPrivateKeyFor', {address, opts});
  //   if (!address) {
  //     throw new Error('Must specify address.');
  //   }
  //   const wallet = this._getWalletForAccount(address, opts)
  //   const privKey = ethUtil.toBuffer(wallet.getPrivateKey())
  //   return privKey;
  // }

  // // returns an address specific to an app
  // getAppKeyAddress (address, origin) {
  //   console.log('TONI TolarKeyring getAppKeyAddress', {address, origin});
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const wallet = this._getWalletForAccount(address, {
  //         withAppKeyOrigin: origin,
  //       })
  //       const appKeyAddress = sigUtil.normalize(wallet.getAddress().toString('hex'))
  //       return resolve(appKeyAddress)
  //     } catch (e) {
  //       return reject(e)
  //     }
  //   })
  // }

  // // exportAccount should return a hex-encoded private key:
  // exportAccount (address, opts = {}) {
  //   console.log('TONI TolarKeyring exportAccount', {address, opts});
  //   const wallet = this._getWalletForAccount(address, opts)
  //   return Promise.resolve(wallet.getPrivateKey().toString('hex'))
  // }

  // removeAccount (address) {
  //   console.log('TONI TolarKeyring removeAccount', {address, opts});
  //   if(!this.wallets.map(w => ethUtil.bufferToHex(w.getAddress()).toLowerCase()).includes(address.toLowerCase())){
  //     throw new Error(`Address ${address} not found in this keyring`)
  //   }
  //   this.wallets = this.wallets.filter( w => ethUtil.bufferToHex(w.getAddress()).toLowerCase() !== address.toLowerCase())
  // }

  // /* PRIVATE METHODS */

  // _getWalletForAccount (account, opts = {}) {
  //   console.log('TONI TolarKeyring _getWalletForAccount', {account, opts});
  //   const address = sigUtil.normalize(account)
  //   let wallet = this.wallets.find(w => ethUtil.bufferToHex(w.getAddress()) === address)
  //   if (!wallet) throw new Error('Simple Keyring - Unable to find matching address.')

  //   if (opts.withAppKeyOrigin) {
  //     const privKey = wallet.getPrivateKey()
  //     const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8')
  //     const appKeyBuffer = Buffer.concat([privKey, appKeyOriginBuffer])
  //     const appKeyPrivKey = ethUtil.keccak(appKeyBuffer, 256)
  //     wallet = Wallet.fromPrivateKey(appKeyPrivKey)
  //   }

  //   return wallet
  // }

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

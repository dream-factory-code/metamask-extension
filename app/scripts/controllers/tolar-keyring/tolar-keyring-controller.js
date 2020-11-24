import KeyringController from 'eth-keyring-controller'

const { normalize: normalizeAddress } = require('eth-sig-util')

export class TolarKeyringController extends KeyringController{
  constructor(opts){
    super(opts)
    // console.log('TONI tolar keyring constructed')
  }

  // createFirstKeyTree () {
  //   console.log('TONI create first key tree')
  //   this.clearKeyrings()
  //   return this.addNewKeyring('Tolar Keyring', { numberOfAccounts: 1 })
  //     .then((keyring) => {
  //       console.log('TONI, keyring added', keyring, 'TONI trying to get accounts')
  //       return keyring.getAccounts()
  //     })
  //     .then(([firstAccount]) => {
  //       if (!firstAccount) {
  //         throw new Error('KeyringController - No account found on keychain.')
  //       }
  //       const hexAccount = firstAccount;//normalizeAddress(firstAccount)
  //       this.emit('newVault', hexAccount)
  //       return null
  //     })
  // }

  createFirstKeyTree () {
    console.log('TONI createFirstKeyTree')
    this.clearKeyrings()
    return this.addNewKeyring('Tolar Keyring', { numberOfAccounts: 1 })
      .then((keyring) => {
        return keyring.getAccounts()
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error('KeyringController - No account found on keychain.1')
        }
        const hexAccount = normalizeAddress(firstAccount)
        this.emit('newVault', hexAccount)
        return null
      })
  }
}

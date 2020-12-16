const defaultNetworksData = [
  {
    labelKey: 'mainnet',
    iconColor: '#29B6AF',
    providerType: 'mainnet',
    rpcUrl: 'https://tolar.dream-factory.hr',
   // chainId: '1',
    ticker: 'TOL',
    blockExplorerUrl: 'https://hashnet.dream-factory.hr',
  },
  {
    labelKey: 'staging',
    iconColor: '#FF4A8D',
    providerType: 'staging',
    rpcUrl: 'https://tolar-staging.dream-factory.hr',
    //chainId: '3',
    ticker: 'TOL',
    blockExplorerUrl: 'https://hashnet-staging.dream-factory.hr',
  },
  {
    labelKey: 'testnet',
    iconColor: '#F6C343',
    providerType: 'testnet',
    rpcUrl: 'https://tolar-test.dream-factory.hr',
   // chainId: '4',
    ticker: 'TOL',
    blockExplorerUrl: 'https://hashnet-test.dream-factory.hr',
  },
  {
    labelKey: 'localhost',
    iconColor: 'white',
    border: '1px solid #6A737D',
    providerType: 'localhost',
    rpcUrl: 'http://localhost:8545/',
    blockExplorerUrl: 'https://hashnet.dream-factory.hr',
  },
]

export {
  defaultNetworksData,
}

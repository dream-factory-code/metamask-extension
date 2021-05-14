const defaultNetworksData = [
  {
    labelKey: "mainnet",
    iconColor: "#29B6AF",
    providerType: "mainnet",
    rpcUrl: "https://gateway.dev.tolar.io",

    ticker: "TOL",
    blockExplorerUrl: "https://explorer.tolar.io",
  },

  {
    labelKey: "testnet",
    iconColor: "#F6C343",
    providerType: "testnet",
    rpcUrl: "https://testnet-gateway.dev.tolar.io",
    // chainId: '4',
    ticker: "TOL",
    blockExplorerUrl: "https://testnet-explorer.tolar.io",
  },
  {
    labelKey: "localhost",
    iconColor: "white",
    border: "1px solid #6A737D",
    providerType: "localhost",
    rpcUrl: "http://localhost:8545/",
    blockExplorerUrl: "",
  },
];

export { defaultNetworksData };

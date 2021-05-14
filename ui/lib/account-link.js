export default function getAccountLink(address, network, rpcPrefs) {
  if (rpcPrefs && rpcPrefs.blockExplorerUrl) {
    return `${rpcPrefs.blockExplorerUrl.replace(
      /\/+$/u,
      ""
    )}/address/${address}`;
  }

  switch (network) {
    case "mainnet": // main net
      return `https://explorer.tolar.io/address/${address}`;
    case "testnet": // morden test net
      return ` https://testnet-explorer.tolar.io/address/${address}`;
    default:
      return "";
  }
}

import * as networkEnums from "../../app/scripts/controllers/network/enums";

/**
 * Gets the etherscan.io URL prefix for a given network ID.
 *
 * @param {string} networkId - The network ID to get the prefix for.
 * @returns {string} The etherscan.io URL prefix for the given network ID.
 */
export function getEtherscanNetworkPrefix(networkId) {
  switch (networkId) {
    case networkEnums.TESTNET_NETWORK_ID:
      return "testnet-gateway-01.dev.";
    case networkEnums.MAINNET_NETWORK_ID:
      return "mainnet-gateway-01.dev.";
    // case networkEnums.KOVAN_NETWORK_ID:
    //   return 'kovan.'
    // case networkEnums.GOERLI_NETWORK_ID:
    //   return 'goerli.'
    default:
      // also covers mainnet
      return "";
  }
}

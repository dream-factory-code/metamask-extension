import mergeMiddleware from "json-rpc-engine/src/mergeMiddleware";
import createScaffoldMiddleware from "json-rpc-engine/src/createScaffoldMiddleware";
import createWalletSubprovider from "eth-json-rpc-middleware/wallet";
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from "./middleware/pending";

export default function createTaquinMiddleware({
  version,
  getAccounts,
  processTransaction,
  processEthSignMessage,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  processPersonalMessage,
  processDecryptMessage,
  processEncryptionPublicKey,
  getPendingNonce,
  getPendingTransactionByHash,
}) {
  const taquinMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      // staticSubprovider
      eth_syncing: false,
      web3_clientVersion: `Taquin/v${version}`,
    }),
    createWalletSubprovider({
      getAccounts,
      processTransaction,
      processEthSignMessage,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
      processPersonalMessage,
      processDecryptMessage,
      processEncryptionPublicKey,
    }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createPendingTxMiddleware({ getPendingTransactionByHash }),
  ]);
  return taquinMiddleware;
}

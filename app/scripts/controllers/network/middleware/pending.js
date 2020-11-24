import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'
import { formatTxMetaForRpcResult } from '../util'

export function createPendingNonceMiddleware ({ getPendingNonce }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req
    // if (method !== 'eth_getTransactionCount') {
    if (method !== 'tol_getNonce') {
      next()
      return
    }
    const [param, blockRef] = params
    if (blockRef !== 'pending') {
      next()
      return
    }
    res.result = await getPendingNonce(param)
  })
}

export function createPendingTxMiddleware ({ getPendingTransactionByHash }) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req
    // if (method !== 'eth_getTransactionByHash') {
    if (method !== 'tol_getTransaction') {
      next()
      return
    }
    const [hash] = params
    const txMeta = getPendingTransactionByHash(hash)
    if (!txMeta) {
      next()
      return
    }
    res.result = formatTxMetaForRpcResult(txMeta)
  })
}

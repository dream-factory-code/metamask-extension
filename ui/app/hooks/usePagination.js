import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

import { getCurrentTxPage } from "../selectors";

/**
 * Determine whether a transaction can be cancelled and provide a method to
 * kick off the process of cancellation.
 *
 * Provides a reusable hook that, given a transactionGroup, will return
 * whether or not the account has enough funds to cover the gas cancellation
 * fee, and a method for beginning the cancellation process
 * @param {Object} transactionGroup
 * @return {[boolean, Function]}
 */
export function usePagination(transactionGroup) {
  const dispatch = useDispatch();
  const currentPage = useSelector(getCurrentTxPage);
  const paginate = useCallback(
    (event) => {
      event.stopPropagation();

      return dispatch(
        showModal({
          name: "CANCEL_TRANSACTION",
          transactionId: id,
          originalGasPrice: gasPrice,
        })
      );
    },
    [dispatch, id, gasPrice]
  );

  const hasEnoughCancelGas =
    primaryTransaction.txParams &&
    isBalanceSufficient({
      amount: "0x0",
      gasTotal: getHexGasTotal({
        gasPrice: increaseLastGasPrice(gasPrice),
        gasLimit: primaryTransaction.txParams.gas,
      }),
      balance: selectedAccount.balance,
      conversionRate,
    });

  return [hasEnoughCancelGas, cancelTransaction];
}

import { connect } from "react-redux";
import ethUtil from "ethereumjs-util";
import {
  addToAddressBook,
  clearSend,
  signTokenTx,
  signTx,
  updateTransaction,
  cancelTx,
} from "../../../store/actions";
import {
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getSendToken,
  getSendAmount,
  getTolarTx,
  getTolarSignedTx,
  getSendEditingTransactionId,
  getSendFromObject,
  getSendTo,
  getSendToAccounts,
  getSendHexData,
  getTokenBalance,
  getUnapprovedTxs,
  getSendErrors,
  isSendFormInError,
  getGasIsLoading,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from "../../../selectors";
import { getMostRecentOverviewPage } from "../../../ducks/history/history";
import SendFooter from "./send-footer.component";
import {
  addressIsNew,
  constructTxParams,
  constructTolarTxParams,
  constructUpdatedTx,
} from "./send-footer.utils";
import { clearConfirmTransaction } from "../../../ducks/confirm-transaction/confirm-transaction.duck";

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter);

function mapStateToProps(state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state);
  const gasPrice = getGasPrice(state);
  const activeButtonIndex = getDefaultActiveButtonIndex(
    gasButtonInfo,
    gasPrice
  );
  const gasEstimateType =
    activeButtonIndex >= 0
      ? gasButtonInfo[activeButtonIndex].gasEstimateType
      : "custom";
  const editingTransactionId = getSendEditingTransactionId(state);

  return {
    amount: getSendAmount(state),
    data: getSendHexData(state),
    editingTransactionId,
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPrice: getGasPrice(state),
    gasTotal: getGasTotal(state),
    tolarTx: getTolarTx(state),
    tolarSignedTx: getTolarSignedTx(state),
    inError: isSendFormInError(state),
    sendToken: getSendToken(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    tokenBalance: getTokenBalance(state),
    unapprovedTxs: getUnapprovedTxs(state),
    sendErrors: getSendErrors(state),
    gasEstimateType,
    gasIsLoading: getGasIsLoading(state),
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    cancelTx: (opts) => dispatch(cancelTx(opts)),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    sign: (opts) => {
      const { sendToken, to, amount, from, gas, gasPrice, data } = opts;
      console.log("TONI debug sign", opts);
      const txParams = constructTolarTxParams({
        amount,
        data,
        from,
        gas,
        gasPrice,
        sendToken,
        to,
      });

      sendToken
        ? dispatch(signTokenTx(sendToken.address, to, amount, txParams))
        : dispatch(signTx(txParams));
    },
    update: ({
      amount,
      data,
      editingTransactionId,
      from,
      gas,
      gasPrice,
      sendToken,
      to,
      unapprovedTxs,
    }) => {
      const editingTx = constructUpdatedTx({
        amount,
        data,
        editingTransactionId,
        from,
        gas,
        gasPrice,
        sendToken,
        to,
        unapprovedTxs,
      });

      return dispatch(updateTransaction(editingTx));
    },

    addToAddressBookIfNew: (newAddress, toAccounts, nickname = "") => {
      // const hexPrefixedAddress = ethUtil.addHexPrefix(newAddress);
      // if (addressIsNew(toAccounts, hexPrefixedAddress)) {
      //   // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
      //   dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      // }
    },
  };
}

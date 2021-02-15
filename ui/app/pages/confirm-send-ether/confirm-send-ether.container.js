import { connect } from "react-redux";
import { compose } from "redux";
import { withRouter } from "react-router-dom";
import { updateSend } from "../../store/actions";
import { clearConfirmTransaction } from "../../ducks/confirm-transaction/confirm-transaction.duck";
import ConfirmSendEther from "./confirm-send-ether.component";

const mapStateToProps = (state) => {
  const {
    confirmTransaction: { txData: { txParams } = {} },
  } = state;
  const { confirmTransaction } = state;
  return {
    txParams,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: (txData) => {
      const { id, txParams } = txData;
      const {
        sender_address: from,
        gas: gasLimit,
        gas_price: gasPrice,
        receiver_address: to,
        amount,
      } = txParams?.body || txParams;
      console.log("toni debug edit tx data", {
        txData,
        txParams,
        from,
        gasLimit,
        gasPrice,
        gasTotal: null,
        to,
        amount,
        errors: { to: null, amount: null },
        editingTransactionId: id && id.toString(),
      });
      dispatch(
        updateSend({
          from,
          gasLimit,
          gasPrice,
          gasTotal: null,
          to,
          amount,
          errors: { to: null, amount: null },
          editingTransactionId: id && id.toString(),
        })
      );
      dispatch(clearConfirmTransaction());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmSendEther);

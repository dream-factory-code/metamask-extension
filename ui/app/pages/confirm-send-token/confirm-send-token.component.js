import React, { Component } from "react";
import PropTypes from "prop-types";
import ConfirmTokenTransactionBaseContainer from "../confirm-token-transaction-base";
import { SEND_ROUTE } from "../../helpers/constants/routes";

export default class ConfirmSendToken extends Component {
  static propTypes = {
    history: PropTypes.object,
    editTransaction: PropTypes.func,
    tokenAmount: PropTypes.number,
  };

  handleEdit(confirmTransactionData) {
    const { editTransaction, history } = this.props;
    console.log(
      "toni debug back tx nav 1",
      JSON.parse(JSON.stringify(confirmTransactionData))
    );
    editTransaction(confirmTransactionData);
    console.log(
      "toni debug back tx nav 2",
      JSON.parse(JSON.stringify(confirmTransactionData))
    );
    history.push(SEND_ROUTE);
  }

  render() {
    const { tokenAmount } = this.props;

    return (
      <ConfirmTokenTransactionBaseContainer
        onEdit={(confirmTransactionData) =>
          this.handleEdit(confirmTransactionData)
        }
        tokenAmount={tokenAmount}
      />
    );
  }
}

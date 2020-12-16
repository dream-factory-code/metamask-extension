import { connect } from "react-redux";
import * as actions from "../../../../store/actions";
import NewAccountModal from "./new-account-modal.component";

function mapStateToProps(state) {
  return {
    ...(state.appState.modal.modalState.props || {}),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    createAccount: (newAccountName) => {
      return dispatch(actions.addNewAccount()).then((newAccountAddress) => {
        if (newAccountName) {
          dispatch(actions.setAccountLabel(newAccountAddress, newAccountName));
        }
        return newAccountAddress;
      });
    },
  };
}

function mergeProps(stateProps, dispatchProps) {
  const { onCreateNewAccount } = stateProps;
  const { createAccount } = dispatchProps;

  return {
    ...stateProps,
    ...dispatchProps,
    onSave: (newAccountName) => {
      return createAccount(newAccountName)
        .then((newAccountAddress) => {
          console.log("TONI debug account create", newAccountAddress);
          return onCreateNewAccount(newAccountAddress);
        })
        .catch((e) => {
          console.log("TONI debug account create error", e);
        });
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(NewAccountModal);

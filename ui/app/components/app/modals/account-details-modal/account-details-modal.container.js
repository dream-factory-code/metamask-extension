import { connect } from "react-redux";
import { showModal, setAccountLabel } from "../../../../store/actions";
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
} from "../../../../selectors";
import AccountDetailsModal from "./account-details-modal.component";

const mapStateToProps = (state) => {
  return {
    network: state.taquin.network,
    selectedIdentity: getSelectedIdentity(state),
    keyrings: state.taquin.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: "EXPORT_PRIVATE_KEY" })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountDetailsModal);

import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { compose } from "redux";

import * as actions from "../../../store/actions";
import AppHeader from "./app-header.component";

const mapStateToProps = (state) => {
  const { appState, taquin } = state;
  const { networkDropdownOpen } = appState;
  const { network, provider, selectedAddress, isUnlocked, isAccountMenuOpen } =
    taquin;

  return {
    networkDropdownOpen,
    network,
    provider,
    selectedAddress,
    isUnlocked,
    isAccountMenuOpen,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AppHeader);

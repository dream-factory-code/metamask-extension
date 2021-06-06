import { connect } from "react-redux";
import { compose } from "redux";
import { withRouter } from "react-router-dom";
import {
  toggleAccountMenu,
  showAccountDetail,
  hideSidebar,
  lockTaquin,
  hideWarning,
} from "../../../store/actions";
import {
  getAddressConnectedDomainMap,
  getTaquinAccountsOrdered,
  getTaquinKeyrings,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from "../../../selectors";
import AccountMenu from "./account-menu.component";

/**
 * The min amount of accounts to show search field
 */
const SHOW_SEARCH_ACCOUNTS_MIN_COUNT = 5;

function mapStateToProps(state) {
  const {
    taquin: { isAccountMenuOpen },
  } = state;
  const accounts = getTaquinAccountsOrdered(state);
  const origin = getOriginOfCurrentTab(state);
  const selectedAddress = getSelectedAddress(state);

  return {
    isAccountMenuOpen,
    addressConnectedDomainMap: getAddressConnectedDomainMap(state),
    originOfCurrentTab: origin,
    selectedAddress,
    keyrings: getTaquinKeyrings(state),
    accounts,
    shouldShowAccountsSearch: accounts.length >= SHOW_SEARCH_ACCOUNTS_MIN_COUNT,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    showAccountDetail: (address) => {
      dispatch(showAccountDetail(address));
      dispatch(hideSidebar());
      dispatch(toggleAccountMenu());
    },
    lockTaquin: () => {
      dispatch(lockTaquin());
      dispatch(hideWarning());
      dispatch(hideSidebar());
      dispatch(toggleAccountMenu());
    },
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountMenu);

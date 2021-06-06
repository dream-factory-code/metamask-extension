import { connect } from "react-redux";
import { getTaquinAccounts, getSendTokenAddress } from "../../../../selectors";
import { updateSendToken } from "../../../../store/actions";
import SendAssetRow from "./send-asset-row.component";

function mapStateToProps(state) {
  return {
    tokens: state.taquin.tokens,
    selectedAddress: state.taquin.selectedAddress,
    sendTokenAddress: getSendTokenAddress(state),
    accounts: getTaquinAccounts(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setSendToken: (token) => dispatch(updateSendToken(token)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);

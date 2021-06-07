import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { lockTaquin } from "../../store/actions";
import Lock from "./lock.component";

const mapStateToProps = (state) => {
  const {
    taquin: { isUnlocked },
  } = state;

  return {
    isUnlocked,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    lockTaquin: () => dispatch(lockTaquin()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Lock);

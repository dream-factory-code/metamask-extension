import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { compose } from "redux";
import { closeWelcomeScreen } from "../../../store/actions";
import Welcome from "./welcome.component";

const mapStateToProps = ({ taquin }) => {
  const { welcomeScreenSeen, participateInMetaMetrics } = taquin;

  return {
    welcomeScreenSeen,
    participateInMetaMetrics,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    closeWelcomeScreen: () => dispatch(closeWelcomeScreen()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Welcome);

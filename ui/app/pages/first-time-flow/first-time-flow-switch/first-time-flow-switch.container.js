import { connect } from "react-redux";
import FirstTimeFlowSwitch from "./first-time-flow-switch.component";

const mapStateToProps = ({ taquin }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    participateInMetaMetrics: optInMetaMetrics,
  } = taquin;

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    optInMetaMetrics,
  };
};

export default connect(mapStateToProps)(FirstTimeFlowSwitch);

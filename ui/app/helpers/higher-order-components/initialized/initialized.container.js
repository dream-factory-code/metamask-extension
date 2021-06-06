import { connect } from "react-redux";
import Initialized from "./initialized.component";

const mapStateToProps = (state) => {
  const {
    taquin: { completedOnboarding },
  } = state;

  return {
    completedOnboarding,
  };
};

export default connect(mapStateToProps)(Initialized);

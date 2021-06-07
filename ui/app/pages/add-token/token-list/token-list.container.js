import { connect } from "react-redux";
import TokenList from "./token-list.component";

const mapStateToProps = ({ taquin }) => {
  const { tokens } = taquin;
  return {
    tokens,
  };
};

export default connect(mapStateToProps)(TokenList);

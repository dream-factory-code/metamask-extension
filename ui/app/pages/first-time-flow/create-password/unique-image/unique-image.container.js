import { connect } from "react-redux";
import UniqueImage from "./unique-image.component";

const mapStateToProps = ({ taquin }) => {
  const { selectedAddress } = taquin;

  return {
    address: selectedAddress,
  };
};

export default connect(mapStateToProps)(UniqueImage);

import { connect } from "react-redux";
import { showModal } from "../../../../store/actions";
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from "../../../../helpers/utils/conversions.util";
import AdvancedGasInputs from "./advanced-gas-inputs.component";

function convertGasPriceForInputs(gasPriceInHexWEI) {
  return Number(gasPriceInHexWEI /*hexWEIToDecGWEI(gasPriceInHexWEI)*/);
}

function convertGasLimitForInputs(gasLimitInHexWEI) {
  return gasLimitInHexWEI /*parseInt(gasLimitInHexWEI, 16)*/ || 0;
}

const mapDispatchToProps = (dispatch) => {
  return {
    showGasPriceInfoModal: () =>
      dispatch(showModal({ name: "GAS_PRICE_INFO_MODAL" })),
    showGasLimitInfoModal: () =>
      dispatch(showModal({ name: "GAS_LIMIT_INFO_MODAL" })),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    customGasPrice,
    customGasLimit,
    updateCustomGasPrice,
    updateCustomGasLimit,
  } = ownProps;
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    customGasPrice: convertGasPriceForInputs(customGasPrice),
    customGasLimit: convertGasLimitForInputs(customGasLimit),
    updateCustomGasPrice: (price) => {
      return updateCustomGasPrice(price /*decGWEIToHexWEI(price)*/);
    },
    updateCustomGasLimit: (limit) =>
      updateCustomGasLimit(limit /*decimalToHex(limit)*/),
  };
};

export default connect(null, mapDispatchToProps, mergeProps)(AdvancedGasInputs);

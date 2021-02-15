import { connect } from "react-redux";
import { getPreferences } from "../../../selectors";
import UserPreferencedCurrencyInput from "./user-preferenced-currency-input.component";

const mapStateToProps = (state) => {
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);
  console.log("toni debug amount flow ", useNativeCurrencyAsPrimaryCurrency);
  return {
    useNativeCurrencyAsPrimaryCurrency,
  };
};

export default connect(mapStateToProps)(UserPreferencedCurrencyInput);

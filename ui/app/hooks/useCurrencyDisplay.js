import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  formatCurrency,
  getValueFromWeiHex,
} from "../helpers/utils/confirm-tx.util";
import {
  getCurrentCurrency,
  getConversionRate,
  getNativeCurrency,
} from "../selectors";
import BN from "bn.js";

/**
 * Defines the shape of the options parameter for useCurrencyDisplay
 * @typedef {Object} UseCurrencyOptions
 * @property {string} [displayValue]     - When present is used in lieu of formatting the inputValue
 * @property {string} [prefix]           - String to prepend to the final result
 * @property {number} [numberOfDecimals] - Number of significant decimals to display
 * @property {string} [denomination]     - Denomination (wei, gwei) to convert to for display
 * @property {string} [currency]         - Currency type to convert to. Will override nativeCurrency
 */

/**
 * Defines the return shape of the second value in the tuple
 * @typedef {Object} CurrencyDisplayParts
 * @property {string} [prefix]  - string to prepend to the value for display
 * @property {string} value     - string representing the value, formatted for display
 * @property {string} [suffix]  - string to append to the value for display
 */

/**
 * useCurrencyDisplay hook
 *
 * Given a hexadecimal encoded value string and an object of parameters used for formatting the
 * display, produce both a fully formed string and the pieces of that string used for displaying
 * the currency to the user
 * @param {string} inputValue          - The value to format for display
 * @param {UseCurrencyOptions} opts    - An object for options to format the inputValue
 * @return {[string, CurrencyDisplayParts]}
 */
export function useCurrencyDisplay(
  inputValue,
  { displayValue, prefix, numberOfDecimals, denomination, currency, ...opts }
) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const conversionRate = useSelector(getConversionRate);

  const toCurrency = currency || currentCurrency;

  const value = useMemo(() => {
    if (displayValue) {
      return displayValue;
    }

    return formatCurrency(
      inputValue,
      // getValueFromWeiHex({
      //   value: inputValue.balance,
      //   fromCurrency: nativeCurrency,
      //   toCurrency,
      //   conversionRate,
      //   numberOfDecimals: numberOfDecimals || 2,
      //   toDenomination: denomination,
      // }),
      toCurrency
    );
  }, [
    (inputValue && inputValue.balance) || inputValue || 0,
    nativeCurrency,
    conversionRate,
    displayValue,
    numberOfDecimals,
    denomination,
    toCurrency,
  ]);

  let suffix;

  if (!opts.hideLabel) {
    suffix = opts.suffix || (toCurrency && toCurrency.toUpperCase()) || "";
  }

  return [
    `${prefix || ""}${value || 0}${suffix ? ` ${suffix}` : ""}`,
    { prefix, value, suffix },
  ];
}

export function parseTolarDisplay(val) {
  const bnVal = new BN((val + "").replace("0x", ""));

  return bnVal.gt(new BN(1e15 + ""))
    ? `${bnVal.divRound(new BN(1e15 + "")).toNumber() / 1000} TOL`
    : `${val || ""} aTOL`;
}

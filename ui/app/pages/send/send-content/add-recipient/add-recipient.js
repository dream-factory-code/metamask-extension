import ethUtil from "ethereumjs-util";
import contractMap from "eth-contract-metadata";
import {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
} from "../../send.constants";
import EthQuery from "eth-query";
import { NETWORK_TYPE_TO_SUBDOMAIN_MAP } from "../../../../../../app/scripts/controllers/network/enums";
import {
  isValidAddress,
  isEthNetwork,
  checkExistingAddresses,
} from "../../../../helpers/utils/util";
const pify = require("pify");

export function getToErrorObject(to, hasHexData = false, network) {
  console.log("TONI DEBUG");
  // const query = new EthQuery(
  //   `https://${NETWORK_TYPE_TO_SUBDOMAIN_MAP[network]}.dreamfactory.hr`
  // );
  let toError = null;
  if (!to) {
    if (!hasHexData) {
      toError = REQUIRED_ERROR;
    }
  } else if (
    // TODO TONI: check if validation should happen on this place
    // !(await pify(() =>
    //   query.sendAsync({
    //     method: "account_verifyAddress",
    //     params: [to],
    //   })
    // )()) &&
    false &&
    !toError
  ) {
    toError = INVALID_RECIPIENT_ADDRESS_ERROR;
  }
  return { to: toError };
}

export function getToWarningObject(to, tokens = [], sendToken = null) {
  let toWarning = null;
  if (
    sendToken &&
    (ethUtil.toChecksumAddress(to) in contractMap ||
      checkExistingAddresses(to, tokens))
  ) {
    toWarning = KNOWN_RECIPIENT_ADDRESS_ERROR;
  }
  return { to: toWarning };
}

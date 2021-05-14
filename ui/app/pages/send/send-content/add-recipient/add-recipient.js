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
  let toError = null;
  if (!to) {
    if (!hasHexData) {
      toError = REQUIRED_ERROR;
    }
  } else if (false && !toError) {
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

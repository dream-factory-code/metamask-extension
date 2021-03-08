import { useSelector } from "react-redux";
import { getKnownMethodData, getSelectedAddress } from "../selectors/selectors";
import {
  getTransactionActionKey,
  getStatusKey,
} from "../helpers/utils/transactions.util";
import { camelCaseToCapitalize } from "../helpers/utils/common.util";
import { PRIMARY, SECONDARY } from "../helpers/constants/common";
import { getTokenToAddress } from "../helpers/utils/token-util";
import {
  formatDateWithYearContext,
  shortenAddress,
  stripHttpSchemes,
} from "../helpers/utils/util";
import {
  CONTRACT_INTERACTION_KEY,
  DEPLOY_CONTRACT_ACTION_KEY,
  INCOMING_TRANSACTION,
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
  TRANSACTION_CATEGORY_APPROVAL,
  TRANSACTION_CATEGORY_INTERACTION,
  TRANSACTION_CATEGORY_RECEIVE,
  TRANSACTION_CATEGORY_SEND,
  TRANSACTION_CATEGORY_SIGNATURE_REQUEST,
  TOKEN_METHOD_APPROVE,
  PENDING_STATUS_HASH,
  TOKEN_CATEGORY_HASH,
} from "../helpers/constants/transactions";
import { getTokens } from "../ducks/metamask/metamask";
import { useI18nContext } from "./useI18nContext";
import { useTokenFiatAmount } from "./useTokenFiatAmount";
import { useUserPreferencedCurrency } from "./useUserPreferencedCurrency";
import { useCurrencyDisplay } from "./useCurrencyDisplay";
import { useTokenDisplayValue } from "./useTokenDisplayValue";
import { useTokenData } from "./useTokenData";
import { NETWORK_TO_NAME_MAP } from "../../../app/scripts/controllers/network/enums";
import BN from "bn.js";
import { toNumber } from "lodash";

/**
 * @typedef {Object} TransactionDisplayData
 * @property {string} title                  - primary description of the transaction
 * @property {string} subtitle               - supporting text describing the transaction
 * @property {bool}   subtitleContainsOrigin - true if the subtitle includes the origin of the tx
 * @property {string} category               - the transaction category
 * @property {string} primaryCurrency        - the currency string to display in the primary position
 * @property {string} [secondaryCurrency]    - the currency string to display in the secondary position
 * @property {string} status                 - the status of the transaction
 * @property {string} senderAddress          - the Ethereum address of the sender
 * @property {string} recipientAddress       - the Ethereum address of the recipient
 */

/**
 * Get computed values used for displaying transaction data to a user
 *
 * The goal of this method is to perform all of the necessary computation and
 * state access required to take a transactionGroup and derive from it a shape
 * of data that can power all views related to a transaction. Presently the main
 * case is for shared logic between transaction-list-item and transaction-detail-view
 * @param {Object} transaction group of transactions
 * @return {TransactionDisplayData}
 */
export function useTolarTransactionDisplayData(transaction) {
  const knownTokens = useSelector(getTokens);
  const t = useI18nContext();
  // const { initialTransaction, primaryTransaction } = transactionGroup
  // initialTransaction contains the data we need to derive the primary purpose of this transaction group
  // const { transactionCategory } = initialTransaction
  const address = useSelector(getSelectedAddress);
  const {
    sender_address: senderAddress = "",
    receiver_address: to = "",
    transaction_hash: hash,
  } = transaction;

  const { status = "unknown" } = transaction;
  const { value: primaryValue = "0" } = transaction;
  let prefix = "-";
  const date = formatDateWithYearContext(transaction.time || 0);
  // let subtitle;
  // let subtitleContainsOrigin = false;
  let recipientAddress = to;

  const networkName =
    (transaction &&
      transaction.network &&
      NETWORK_TO_NAME_MAP[transaction.network]) ||
    "Unknown Network";
  let category = senderAddress === address ? "sent-tx" : "received-tx";
  let title =
    senderAddress === address ? "Sent Transaction" : "Received Transaction";

  const subtitle = networkName;

  const networkIdToTypeMap = {
    mainnet: "explorer",
    testnet: "testnet-explorer.dev",
  };

  const network = transaction.network;
  const isTolar = Boolean(networkIdToTypeMap[network]);
  const netPrefix = networkIdToTypeMap[network] || "hashnet";

  const url = isTolar
    ? `https://${netPrefix}.tolar.io/transaction/${hash}`
    : "";

  const parseTolarDisplay = (val) => {
    const bnVal = new BN(val + "");

    return bnVal.gt(new BN(1e15 + ""))
      ? `${bnVal.divRound(new BN(1e15 + "")).toNumber() / 1000} TOL`
      : `${val} aTOL`;
  };
  return {
    title,
    category,
    date,
    subtitle,
    subtitleContainsOrigin: true,
    primaryCurrency: parseTolarDisplay(primaryValue),
    senderAddress,
    recipientAddress,
    hash,
    url,
    secondaryCurrency: `${
      new BN(primaryValue + "").divRound(new BN(1e15 + "")).toNumber() / 1000
    } TOL`,
    //isTokenCategory && !tokenFiatAmount ? undefined : secondaryCurrency,
    status,
    isPending: true, //: status in PENDING_STATUS_HASH,
  };
}

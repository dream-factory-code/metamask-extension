import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import {
  incomingTxListSelector,
  incomingTxPaginationSelector,
} from "../../../selectors/transactions";
import { useI18nContext } from "../../../hooks/useI18nContext";
import TransactionListItem from "../transaction-list-item";
import Button from "../../ui/button";
import { TOKEN_CATEGORY_HASH } from "../../../helpers/constants/transactions";
import { paginate, paginate2 } from "../../../store/actions";

const PAGE_INCREMENT = 5;
const getTransactionGroupRecipientAddressFilter = (recipientAddress) => {
  return (args) => {
    const {
      initialTransaction: { txParams },
    } = args;
    return txParams && txParams.to === recipientAddress;
  };
};

const tokenTransactionFilter = ({
  initialTransaction: { transactionCategory },
}) => !TOKEN_CATEGORY_HASH[transactionCategory];

const getFilteredTransactionGroups = (
  transactionGroups,
  hideTokenTransactions,
  tokenAddress
) => {
  if (hideTokenTransactions) {
    return transactionGroups.filter(tokenTransactionFilter);
  } else if (tokenAddress) {
    return transactionGroups.filter(
      getTransactionGroupRecipientAddressFilter(tokenAddress)
    );
  }
  return transactionGroups;
};

export default function TransactionList({
  hideTokenTransactions,
  tokenAddress,
}) {
  const [limit, setLimit] = useState(PAGE_INCREMENT);
  const t = useI18nContext();

  const dispatch = useDispatch();

  const defaultPagination = {
    page: 1,
    pageSize: 5,
  };
  const tolarCompletedTransactions = useSelector(incomingTxListSelector);
  const pagination =
    useSelector(incomingTxPaginationSelector) || defaultPagination;
  const { page: currentPage = 1, isLoading = false } = pagination;

  const completedTransactions = tolarCompletedTransactions;

  const viewMore = useCallback(
    () => setLimit((prev) => prev + PAGE_INCREMENT),
    []
  );

  const nextPage = () => {
    paginate2(currentPage + 1, dispatch);
  };
  const prevPage = () => {
    paginate2(currentPage - 1, dispatch);
  };

  const firstPage = () => {
    paginate2(1, dispatch);
  };
  return (
    <div className="transaction-list">
      {isLoading && (
        <div class="tx-loading-indicator">
          <i class="fas fa-spinner fa-pulse"></i>
        </div>
      )}

      <div className="transaction-list__transactions">
        <div className="transaction-list__completed-transactions">
          {completedTransactions.length > 0 ? (
            completedTransactions
              .slice(0, limit)
              .map((transactionGroup, index) => (
                <TransactionListItem
                  transactionGroup={transactionGroup}
                  key={`${transactionGroup.nonce}:${limit + index - 10}`}
                />
              ))
          ) : (
            <div className="transaction-list__empty">
              <div className="transaction-list__empty-text">
                {t("noTransactions")}
              </div>
            </div>
          )}
          <div style={{ display: "flex" }}>
            <Button
              className="transaction-list__view-more"
              type="secondary"
              rounded
              onClick={prevPage}
              disabled={pagination.page <= 1}
            >
              Previous Page
            </Button>

            <Button
              className="transaction-list__view-more"
              type="secondary"
              rounded
            >
              {currentPage}
            </Button>

            <Button
              className="transaction-list__view-more"
              type="secondary"
              rounded
              onClick={nextPage}
              disabled={completedTransactions.length < pagination.pageSize}
            >
              Next Page
            </Button>
          </div>
          <Button
            className="transaction-list__view-more"
            type="secondary"
            rounded
            onClick={firstPage}
          >
            First Page
          </Button>
        </div>
      </div>
    </div>
  );
}

TransactionList.propTypes = {
  hideTokenTransactions: PropTypes.bool,
  tokenAddress: PropTypes.string,
};

TransactionList.defaultProps = {
  hideTokenTransactions: false,
  tokenAddress: undefined,
};

import * as actionConstants from "../../store/actionConstants";
import { ALERT_TYPES } from "../../../../app/scripts/controllers/alert";

export default function reduceTaquin(state = {}, action) {
  //TODO changing urls
  const taquinState = {
    isInitialized: false,
    isUnlocked: false,
    isAccountMenuOpen: false,
    rpcTarget: "https://testnet-gateway.dev.tolar.io",
    identities: {},
    unapprovedTxs: {},
    frequentRpcList: [],
    addressBook: [],
    contractExchangeRates: {},
    tokens: [],
    pendingTokens: {},
    customNonceValue: "",
    send: {
      tx: {
        sender_address: "",
        receiver_address: "",
        amount: 0,
        password: "",
        gas: 0,
        gas_price: 1,
        data: "",
        nonce: 0,
      },
      signedTx: null,
      gasLimit: null,
      gasPrice: null,
      gasTotal: null,
      tokenBalance: "0x0",
      from: "",
      to: "",
      amount: "0",
      memo: "",
      errors: {},
      maxModeOn: false,
      incomingTransactionsPagination: {
        page: 1,
        pageSize: 5,
      },
      editingTransactionId: null,
      toNickname: "",
      ensResolution: null,
      ensResolutionError: "",
    },
    useBlockie: false,
    featureFlags: {},
    welcomeScreenSeen: false,
    currentLocale: "",
    preferences: {
      autoLockTimeLimit: undefined,
      showFiatInTestnets: false,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    firstTimeFlowType: null,
    completedOnboarding: false,
    knownMethodData: {},
    participateInMetaMetrics: null,
    metaMetricsSendCount: 0,
    nextNonce: null,
    transactionPagination: {},
    ...state,
  };
  switch (action.type) {
    case actionConstants.UPDATE_TAQUIN_STATE:
      return { ...taquinState, ...action.value };

    case actionConstants.LOCK_TAQUIN:
      return {
        ...taquinState,
        isUnlocked: false,
      };

    case actionConstants.SET_RPC_TARGET:
      return {
        ...taquinState,
        provider: {
          type: "rpc",
          rpcTarget: action.value,
        },
      };

    case actionConstants.SET_PROVIDER_TYPE:
      return {
        ...taquinState,
        provider: {
          type: action.value,
        },
      };

    case actionConstants.SHOW_ACCOUNT_DETAIL:
      return {
        ...taquinState,
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      };

    case actionConstants.SET_ACCOUNT_LABEL: {
      const { account } = action.value;
      const name = action.value.label;
      const id = {};
      id[account] = { ...taquinState.identities[account], name };
      const identities = { ...taquinState.identities, ...id };
      return Object.assign(taquinState, { identities });
    }

    case actionConstants.SET_CURRENT_FIAT:
      return Object.assign(taquinState, {
        currentCurrency: action.value.currentCurrency,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      });

    case actionConstants.UPDATE_TOKENS:
      return {
        ...taquinState,
        tokens: action.newTokens,
      };

    // taquin.send
    case actionConstants.UPDATE_GAS_LIMIT:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          tx: { ...taquinState.send.tx, gas: action.value },
          gasLimit: action.value,
          gas_limit: action.value,
          // gasLimit: action.value,
        },
      };
    case actionConstants.UPDATE_CUSTOM_NONCE:
      return {
        ...taquinState,
        customNonceValue: action.value,
      };
    case actionConstants.UPDATE_GAS_PRICE:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          tx: { ...taquinState.send.tx, gas_price: action.value },
        },
      };

    case actionConstants.TOGGLE_ACCOUNT_MENU:
      return {
        ...taquinState,
        isAccountMenuOpen: !taquinState.isAccountMenuOpen,
      };

    case actionConstants.UPDATE_GAS_TOTAL:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          gasTotal: action.value,
        },
      };

    case actionConstants.UPDATE_SEND_TOKEN_BALANCE:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          tokenBalance: action.value,
        },
      };

    case actionConstants.UPDATE_SEND_HEX_DATA:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          data: action.value,
        },
      };

    case actionConstants.UPDATE_SEND_TO:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          to: action.value.to,
          toNickname: action.value.nickname,
        },
      };

    case actionConstants.UPDATE_SEND_AMOUNT:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          amount: action.value,
        },
      };

    case actionConstants.UPDATE_MAX_MODE:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          maxModeOn: action.value,
        },
      };

    case actionConstants.UPDATE_SEND:
      return Object.assign(taquinState, {
        send: {
          ...taquinState.send,
          ...action.value,
        },
      });

    case actionConstants.UPDATE_SEND_TOKEN: {
      const newSend = {
        ...taquinState.send,
        token: action.value,
      };
      // erase token-related state when switching back to native currency
      if (newSend.editingTransactionId && !newSend.token) {
        const unapprovedTx =
          newSend?.unapprovedTxs?.[newSend.editingTransactionId] || {};
        const txParams = unapprovedTx.txParams || {};
        Object.assign(newSend, {
          tokenBalance: null,
          balance: "0",
          from: unapprovedTx.from || "",
          unapprovedTxs: {
            ...newSend.unapprovedTxs,
            [newSend.editingTransactionId]: {
              ...unapprovedTx,
              txParams: {
                ...txParams,
                data: "",
              },
            },
          },
        });
      }
      return Object.assign(taquinState, {
        send: newSend,
      });
    }

    case actionConstants.UPDATE_SEND_ENS_RESOLUTION:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          ensResolution: action.payload,
          ensResolutionError: "",
        },
      };

    case actionConstants.UPDATE_SEND_ENS_RESOLUTION_ERROR:
      return {
        ...taquinState,
        send: {
          ...taquinState.send,
          ensResolution: null,
          ensResolutionError: action.payload,
        },
      };

    case actionConstants.CLEAR_SEND:
      return {
        ...taquinState,
        // reset unapprovedTxs because change in workflow
        unapprovedTxs: {},
        send: {
          tx: {
            sender_address: "",
            receiver_address: "",
            amount: 0,
            password: "",
            gas: 0,
            gas_price: 1,
            data: "",
            nonce: 0,
          },
          signedTx: null,
          gasLimit: null,
          gasPrice: null,
          gasTotal: null,
          tokenBalance: null,
          from: "",
          to: "",
          amount: "0x0",
          memo: "",
          errors: {},
          maxModeOn: false,
          editingTransactionId: null,
          toNickname: "",
        },
      };

    case actionConstants.UPDATE_TRANSACTION_PARAMS: {
      const { id: txId, value } = action;
      let { currentNetworkTxList } = taquinState;

      currentNetworkTxList = currentNetworkTxList.map((tx) => {
        if (tx.id === txId) {
          const newTx = { ...tx };
          newTx.txParams = value;
          return newTx;
        }
        return tx;
      });

      return {
        ...taquinState,
        currentNetworkTxList,
      };
    }

    case actionConstants.TX_PAGE_CHANGE:
      return {
        ...taquinState,
        transactionPagination: {
          ...taquinState.transactionPagination,
          page: action.value,
        },
      };

    case actionConstants.SET_PARTICIPATE_IN_METAMETRICS:
      return {
        ...taquinState,
        participateInMetaMetrics: action.value,
      };

    case actionConstants.SET_METAMETRICS_SEND_COUNT:
      return {
        ...taquinState,
        metaMetricsSendCount: action.value,
      };

    case actionConstants.SET_USE_BLOCKIE:
      return {
        ...taquinState,
        useBlockie: action.value,
      };

    case actionConstants.UPDATE_FEATURE_FLAGS:
      return {
        ...taquinState,
        featureFlags: action.value,
      };

    case actionConstants.CLOSE_WELCOME_SCREEN:
      return {
        ...taquinState,
        welcomeScreenSeen: true,
      };

    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...taquinState,
        currentLocale: action.value.locale,
      };

    case actionConstants.SET_PENDING_TOKENS:
      return {
        ...taquinState,
        pendingTokens: { ...action.payload },
      };

    case actionConstants.CLEAR_PENDING_TOKENS: {
      return {
        ...taquinState,
        pendingTokens: {},
      };
    }

    case actionConstants.UPDATE_PREFERENCES: {
      return {
        ...taquinState,
        preferences: {
          ...taquinState.preferences,
          ...action.payload,
        },
      };
    }

    case actionConstants.COMPLETE_ONBOARDING: {
      return {
        ...taquinState,
        completedOnboarding: true,
      };
    }

    case actionConstants.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...taquinState,
        firstTimeFlowType: action.value,
      };
    }

    case actionConstants.SET_NEXT_NONCE: {
      return {
        ...taquinState,
        nextNonce: action.value,
      };
    }

    default:
      return taquinState;
  }
}

export const getCurrentLocale = (state) => state.taquin.currentLocale;

export const getAlertEnabledness = (state) => state.taquin.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (state) =>
  getAlertEnabledness(state)[ALERT_TYPES.unconnectedAccount];

export const getUnconnectedAccountAlertShown = (state) =>
  state.taquin.unconnectedAccountAlertShownOrigins;

export const getTokens = (state) => state.taquin.tokens;

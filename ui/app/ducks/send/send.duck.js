// Actions
const OPEN_TO_DROPDOWN = "taquin/send/OPEN_TO_DROPDOWN";
const CLOSE_TO_DROPDOWN = "taquin/send/CLOSE_TO_DROPDOWN";
const UPDATE_SEND_ERRORS = "taquin/send/UPDATE_SEND_ERRORS";
const RESET_SEND_STATE = "taquin/send/RESET_SEND_STATE";
const SHOW_GAS_BUTTON_GROUP = "taquin/send/SHOW_GAS_BUTTON_GROUP";
const HIDE_GAS_BUTTON_GROUP = "taquin/send/HIDE_GAS_BUTTON_GROUP";

const initState = {
  toDropdownOpen: false,
  gasButtonGroupShown: true,
  errors: {},
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case OPEN_TO_DROPDOWN:
      return {
        ...state,
        toDropdownOpen: true,
      };
    case CLOSE_TO_DROPDOWN:
      return {
        ...state,
        toDropdownOpen: false,
      };
    case UPDATE_SEND_ERRORS:
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.value,
        },
      };
    case SHOW_GAS_BUTTON_GROUP:
      return {
        ...state,
        gasButtonGroupShown: true,
      };
    case HIDE_GAS_BUTTON_GROUP:
      return {
        ...state,
        gasButtonGroupShown: false,
      };
    case RESET_SEND_STATE:
      return { ...initState };
    default:
      return state;
  }
}

// Action Creators
export function openToDropdown() {
  return { type: OPEN_TO_DROPDOWN };
}

export function closeToDropdown() {
  return { type: CLOSE_TO_DROPDOWN };
}

export function showGasButtonGroup() {
  return { type: SHOW_GAS_BUTTON_GROUP };
}

export function hideGasButtonGroup() {
  return { type: HIDE_GAS_BUTTON_GROUP };
}

export function updateSendErrors(errorObject) {
  return {
    type: UPDATE_SEND_ERRORS,
    value: errorObject,
  };
}

export function resetSendState() {
  return { type: RESET_SEND_STATE };
}

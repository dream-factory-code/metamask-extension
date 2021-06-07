// Actions
const PAGINATE = "taquin/transactionPagination/TX_PAGE_CHANGE";

const initState = {
  transactionPagination: {
    currentPage: 1,
  },
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case TX_PAGE_CHANGE:
      return {
        ...state,
        currentPage: action.value,
      };

    default:
      return state;
  }
}

export function paginate() {
  return { type: TX_PAGE_CHANGE };
}

function addTodoWithoutCheck(text) {
  return {
    type: "ADD_TODO",
    text,
  };
}

export function addTodo(text) {
  // This form is allowed by Redux Thunk middleware
  // described below in “Async Action Creators” section.
  return function (dispatch, getState) {
    if (getState().todos.length === 3) {
      // Exit early
      return;
    }
    dispatch(addTodoWithoutCheck(text));
  };
}

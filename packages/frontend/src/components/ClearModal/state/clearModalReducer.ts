import { useReducer } from 'react';
import keyMirror from 'keymirror';
export const initialState = {
  isModalOpen: false,
};

const actionTypes = keyMirror({
  OPEN: null,
  CLOSE: null,
});

export const clearModalReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.OPEN:
      return {
        ...state,
        isModalOpen: true,
      };
    case actionTypes.CLOSE:
      return {
        ...state,
        isModalOpen: false,
      };
  }
};

export const open = () => ({ type: actionTypes.OPEN });

export const close = () => ({ type: actionTypes.CLOSE });

export const useClearModalReducer = () => useReducer(clearModalReducer, initialState);

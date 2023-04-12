import { useReducer } from 'react';
import keyMirror from 'keymirror';
import { ReducerAction } from '@frontend/utils/types';

interface ClearModalState {
  isModalOpen: boolean;
}
export const initialState: ClearModalState = {
  isModalOpen: false,
} as never;

const actionTypes = keyMirror({
  OPEN: null,
  CLOSE: null,
});

export const clearModalReducer = (state: ClearModalState, action: ReducerAction) => {
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
    default:
      return state;
  }
};

export const open = () => ({ type: actionTypes.OPEN });

export const close = () => ({ type: actionTypes.CLOSE });

export const useClearModalReducer = () => useReducer(clearModalReducer, initialState);

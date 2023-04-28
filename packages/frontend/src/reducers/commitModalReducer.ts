/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { useReducer } from 'react';
import keyMirror from 'keymirror';
import { ReducerAction } from '@frontend/types';

interface CommitModalReducerState {
  isModalOpen: boolean;
  commitMessage: string;
  commitBranchName: string;
  response: string | undefined;
}

export const initialState: CommitModalReducerState = {
  isModalOpen: false,
  commitMessage: '',
  commitBranchName: '',
  response: undefined,
};

const actionTypes = keyMirror({
  UPDATE_BRANCH_NAME: null,
  UPDATE_COMMIT_MESSAGE: null,
  OPEN: null,
  CLOSE: null,
  UPDATE_RESPONSE: null,
});

export const commitModalReducer = (
  state: CommitModalReducerState,
  action: ReducerAction,
): CommitModalReducerState => {
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
    case actionTypes.UPDATE_BRANCH_NAME:
      return {
        ...state,
        commitBranchName: action.payload,
      };
    case actionTypes.UPDATE_COMMIT_MESSAGE:
      return {
        ...state,
        commitMessage: action.payload,
      };
    case actionTypes.UPDATE_RESPONSE:
      return {
        ...state,
        response: action.payload,
      };
    default:
      return state;
  }
};

export const updateResponse = (payload: any) => ({ type: actionTypes.UPDATE_RESPONSE, payload });

export const open = () => ({ type: actionTypes.OPEN });

export const close = () => ({ type: actionTypes.CLOSE });

export const updateCommitBranchName = (payload: any) => ({
  type: actionTypes.UPDATE_BRANCH_NAME,
  payload,
});
export const updateCommitMessage = (payload: any) => ({
  type: actionTypes.UPDATE_COMMIT_MESSAGE,
  payload,
});

export const useCommitModalReducer = () => useReducer(commitModalReducer, initialState);

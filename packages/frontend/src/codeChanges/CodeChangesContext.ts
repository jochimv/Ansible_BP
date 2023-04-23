import { createContext, Dispatch, useContext } from 'react';
import { CodeChangesState, initialState } from '@frontend/codeChanges/codeChangesReducer';
import { ReducerAction } from '@frontend/utils/types';
type CodeChangesDispatch = Dispatch<ReducerAction>;
export const CodeChangesContext = createContext<CodeChangesState>(initialState);
export const CodeChangesDispatchContext = createContext<CodeChangesDispatch>(() => {});
export const useCodeChangesContext = (): CodeChangesState => useContext(CodeChangesContext);

export const useCodeChangesDispatchContext = (): CodeChangesDispatch =>
  useContext(CodeChangesDispatchContext);

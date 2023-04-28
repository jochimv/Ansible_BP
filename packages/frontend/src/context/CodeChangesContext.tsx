/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer } from 'react';
import {
  codeChangesReducer,
  CodeChangesState,
  initializeContext,
  initialState,
} from '@frontend/reducers/codeChangesReducer';
import { ReducerAction } from '@frontend/types';

type CodeChangesDispatch = Dispatch<ReducerAction>;
export const CodeChangesContext = createContext<CodeChangesState>(initialState);
export const CodeChangesDispatchContext = createContext<CodeChangesDispatch>(() => {});
export const useCodeChangesContext = (): CodeChangesState => useContext(CodeChangesContext);

export const useCodeChangesDispatchContext = (): CodeChangesDispatch =>
  useContext(CodeChangesDispatchContext);

interface CodeChangesProviderProps {
  children: ReactNode;
}

const CodeChangesProvider = ({ children }: CodeChangesProviderProps) => {
  const [codeChanges, dispatch] = useReducer(codeChangesReducer, initialState);

  useEffect(() => {
    const storedCodeChanges = JSON.parse(localStorage.getItem('codeChangesContextData') || '{}');
    if (storedCodeChanges) {
      dispatch(initializeContext(storedCodeChanges));
    }
  }, []);

  return (
    <CodeChangesContext.Provider value={codeChanges}>
      <CodeChangesDispatchContext.Provider value={dispatch}>
        {children}
      </CodeChangesDispatchContext.Provider>
    </CodeChangesContext.Provider>
  );
};
export default CodeChangesProvider;

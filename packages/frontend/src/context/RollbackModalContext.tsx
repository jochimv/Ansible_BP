import { createContext, Dispatch, ReactNode, useContext } from 'react';
import { initialState, useClearModalReducer } from '../reducers/clearModalReducer';
import { ReducerAction } from '@frontend/types';

export const RollbackModalContext = createContext(initialState);
export const RollbackModalDispatchContext = createContext<Dispatch<ReducerAction>>(() => {});
export const useRollbackModalContext = () => useContext(RollbackModalContext);

export const useRollbackModalDispatchContext = () => useContext(RollbackModalDispatchContext);

interface CodeChangesProviderProps {
  children: ReactNode;
}

const ClearModalProvider = ({ children }: CodeChangesProviderProps) => {
  const [clearModalState, dispatch] = useClearModalReducer();

  return (
    <RollbackModalContext.Provider value={clearModalState}>
      <RollbackModalDispatchContext.Provider value={dispatch}>
        {children}
      </RollbackModalDispatchContext.Provider>
    </RollbackModalContext.Provider>
  );
};
export default ClearModalProvider;

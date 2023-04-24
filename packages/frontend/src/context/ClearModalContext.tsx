import { createContext, ReactNode, useContext } from 'react';
import { initialState, useClearModalReducer } from '../reducers/clearModalReducer';

export const ClearModalContext = createContext(initialState);
export const ClearModalDispatchContext = createContext(console.log);
export const useClearModalContext = () => useContext(ClearModalContext);

export const useClearModalDispatchContext = () => useContext(ClearModalDispatchContext);

interface CodeChangesProviderProps {
  children: ReactNode;
}

const ClearModalProvider = ({ children }: CodeChangesProviderProps) => {
  const [clearModalState, dispatch] = useClearModalReducer();

  return (
    <ClearModalContext.Provider value={clearModalState}>
      <ClearModalDispatchContext.Provider value={dispatch}>
        {children}
      </ClearModalDispatchContext.Provider>
    </ClearModalContext.Provider>
  );
};
export default ClearModalProvider;

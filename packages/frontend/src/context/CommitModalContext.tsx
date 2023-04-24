import { createContext, ReactNode, useContext } from 'react';
import { initialState, useCommitModalReducer } from '../reducers/commitModalReducer';

export const CommitModalContext = createContext(initialState);
export const CommitModalDispatchContext = createContext(console.log);
export const useCommitModalContext = () => useContext(CommitModalContext);

export const useCommitModalDispatchContext = () => useContext(CommitModalDispatchContext);

interface CodeChangesProviderProps {
  children: ReactNode;
}

const CommitModalProvider = ({ children }: CodeChangesProviderProps) => {
  const [commitModalState, dispatch] = useCommitModalReducer();
  return (
    <CommitModalContext.Provider value={commitModalState}>
      <CommitModalDispatchContext.Provider value={dispatch}>
        {children}
      </CommitModalDispatchContext.Provider>
    </CommitModalContext.Provider>
  );
};
export default CommitModalProvider;

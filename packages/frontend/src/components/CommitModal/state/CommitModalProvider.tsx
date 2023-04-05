import { useReducer, ReactNode } from 'react';
import { CommitModalContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import { CommitModalDispatchContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import {
  commitModalReducer,
  initialState,
} from '@frontend/components/CommitModal/state/commitModalReducer';

interface CodeChangesProviderProps {
  children: ReactNode;
}

const CommitModalProvider = ({ children }: CodeChangesProviderProps) => {
  const [commitModalState, dispatch] = useReducer(commitModalReducer, initialState);
  return (
    <CommitModalContext.Provider value={commitModalState}>
      <CommitModalDispatchContext.Provider value={dispatch}>
        {children}
      </CommitModalDispatchContext.Provider>
    </CommitModalContext.Provider>
  );
};

export default CommitModalProvider;

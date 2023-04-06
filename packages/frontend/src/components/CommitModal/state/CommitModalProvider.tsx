import { ReactNode } from 'react';
import { CommitModalContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import { CommitModalDispatchContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import { useCommitModalReducer } from '@frontend/components/CommitModal/state/commitModalReducer';

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

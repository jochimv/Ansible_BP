import { ReactNode } from 'react';
import { useClearModalReducer } from '@frontend/components/ClearModal/state/clearModalReducer';
import {
  ClearModalContext,
  ClearModalDispatchContext,
} from '@frontend/components/ClearModal/state/ClearModalContext';

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

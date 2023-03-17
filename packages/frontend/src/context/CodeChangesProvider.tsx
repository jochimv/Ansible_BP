import { useReducer, ReactNode } from 'react';

import { CodeChangesContext, CodeChangesDispatchContext } from '@frontend/context/context';
import { initialState, codeChangesReducer } from '@frontend/context/reducer';

interface CodeChangesProviderProps {
  children: ReactNode;
}

const CodeChangesProvider = ({ children }: CodeChangesProviderProps) => {
  const [codeChanges, dispatch] = useReducer(codeChangesReducer, initialState);
  return (
    <CodeChangesContext.Provider value={codeChanges}>
      <CodeChangesDispatchContext.Provider value={dispatch}>
        {children}
      </CodeChangesDispatchContext.Provider>
    </CodeChangesContext.Provider>
  );
};

export default CodeChangesProvider;

import { useReducer, useEffect, ReactNode } from 'react';

import { CodeChangesContext, CodeChangesDispatchContext } from '@frontend/context/context';
import { initialState, codeChangesReducer, initializeContext } from '@frontend/context/reducer';

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

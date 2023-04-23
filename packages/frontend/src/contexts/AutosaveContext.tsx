import { CodeChangesState } from '@frontend/reducers/codeChangesReducer';
import { useCommandContext } from '@frontend/contexts/CommandContext';
import React, { ReactNode, useEffect } from 'react';
import { useCodeChangesContext } from '@frontend/contexts/CodeChangesContext';
import { ProjectCommand } from '@frontend/types';

interface AutoSaveContextProviderProps {
  children: ReactNode;
}

export const AutoSaveContextProvider = ({ children }: AutoSaveContextProviderProps) => {
  const codeChangesContextData = useCodeChangesContext();
  const { projectsCommands } = useCommandContext();
  useEffect(() => {
    window.addEventListener('beforeunload', () =>
      handleBeforeUnload(codeChangesContextData, projectsCommands),
    );

    return () => {
      window.removeEventListener('beforeunload', () =>
        handleBeforeUnload(codeChangesContextData, projectsCommands),
      );
    };
  }, [codeChangesContextData, projectsCommands]);
  return <>{children}</>;
};
const handleBeforeUnload = (
  codeChangesContextData: CodeChangesState,
  commandContextData: ProjectCommand[],
) => {
  localStorage.setItem('commandsContext', JSON.stringify(commandContextData));
  localStorage.setItem('codeChangesContextData', JSON.stringify(codeChangesContextData));
};

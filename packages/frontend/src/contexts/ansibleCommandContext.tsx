// contexts/AnsibleCommandsContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AnsibleCommand {
  id: number;
  command: string;
}

interface AnsibleCommandsContextValue {
  commands: AnsibleCommand[];
  addCommand: (command: string) => void;
  removeCommand: (id: number) => void;
}

const AnsibleCommandsContext = createContext<AnsibleCommandsContextValue | undefined>(undefined);

export const useAnsibleCommands = () => {
  const context = useContext(AnsibleCommandsContext);
  if (!context) {
    throw new Error('useAnsibleCommands must be used within AnsibleCommandsProvider');
  }
  return context;
};

interface AnsibleCommandsProviderProps {
  children: ReactNode;
}
export const AnsibleCommandsProvider = ({ children }: AnsibleCommandsProviderProps) => {
  const [commands, setCommands] = useState<AnsibleCommand[]>([]);

  const addCommand = (command: string) => {
    const id = Date.now();
    setCommands((prevCommands) => [...prevCommands, { id, command }]);
  };

  const removeCommand = (id: number) => {
    setCommands((prevCommands) => prevCommands.filter((cmd) => cmd.id !== id));
  };

  return (
    <AnsibleCommandsContext.Provider value={{ commands, addCommand, removeCommand }}>
      {children}
    </AnsibleCommandsContext.Provider>
  );
};

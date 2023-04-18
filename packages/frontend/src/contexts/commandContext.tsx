import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Command {
  id: number;
  command: string;
  alias: string;
  mode: 'builder' | 'ad-hoc';
  builderData?: {
    selectedPlaybook: any;
    selectedInventoryType: string | null;
    selectedInventoryPath: string | null;
    selectedGroup: string | null;
    selectedHost: string | null;
    additionalVariables: string;
  };
}
export interface CommandsContextValue {
  commands: Command[];
  addCommand: (
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => void;
  removeCommand: (id: number) => void;
  updateCommand: (
    id: number,
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => void;
}

const CommandContext = createContext<CommandsContextValue | undefined>(undefined);

export const useCommandContext = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandContext must be used within a CommandsProvider');
  }
  return context;
};

interface AnsibleCommandsProviderProps {
  children: ReactNode;
}
export const CommandsProvider = ({ children }: AnsibleCommandsProviderProps) => {
  const [commands, setCommands] = useState<Command[]>([]);

  useEffect(() => {
    const commands = JSON.parse(localStorage.getItem('commandsContext') || '[]');
    if (commands) {
      setCommands(commands);
    }
  }, []);

  const updateCommand = (
    id: number,
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => {
    setCommands((prevCommands) =>
      prevCommands.map((cmd) => (cmd.id === id ? { id, command, alias, mode, builderData } : cmd)),
    );
  };

  const addCommand = (
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => {
    const id = Date.now();
    setCommands((prevCommands) => [...prevCommands, { id, command, alias, mode, builderData }]);
  };

  const removeCommand = (id: number) => {
    setCommands((prevCommands) => prevCommands.filter((cmd) => cmd.id !== id));
  };

  return (
    <CommandContext.Provider value={{ commands, addCommand, removeCommand, updateCommand }}>
      {children}
    </CommandContext.Provider>
  );
};

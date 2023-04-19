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

export interface ProjectCommand {
  projectName: string;
  commands: Command[];
}
export interface CommandsContextValue {
  projectsCommands: ProjectCommand[];
  addCommand: (
    projectName: string,
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => void;
  removeCommand: (projectName: string, id: number) => void;
  updateCommand: (
    projectName: string,
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
  const [projectsCommands, setProjectsCommands] = useState<ProjectCommand[]>([]);

  useEffect(() => {
    const commands = JSON.parse(localStorage.getItem('commandsContext') || '[]');
    if (commands) {
      setProjectsCommands(commands);
    }
  }, []);

  const updateCommand = (
    projectName: string,
    id: number,
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => {
    setProjectsCommands((prevCommands: ProjectCommand[]) => {
      return prevCommands.map((prevCommand: ProjectCommand) => {
        if (prevCommand.projectName === projectName) {
          return {
            projectName,
            commands: prevCommand.commands.map((cmd: Command) =>
              cmd.id === id ? { id, command, alias, mode, builderData } : cmd,
            ),
          };
        } else {
          return prevCommand;
        }
      });
    });
  };

  const addCommand = (
    projectName: string,
    command: string,
    alias: string,
    mode: 'builder' | 'ad-hoc',
    builderData?: any,
  ) => {
    const id = Date.now();
    setProjectsCommands((prevCommands: ProjectCommand[]) => {
      const projectPresentInContext = !!prevCommands.find(
        (prevCommand: ProjectCommand) => prevCommand.projectName === projectName,
      );
      const newCommand = { id, command, alias, mode, builderData };
      if (projectPresentInContext) {
        return prevCommands.map((prevCommand: ProjectCommand) => {
          if (prevCommand.projectName === projectName) {
            return {
              projectName,
              commands: [...prevCommand.commands, newCommand],
            };
          } else {
            return prevCommand;
          }
        });
      } else {
        return [...prevCommands, { projectName, commands: [newCommand] }];
      }
    });
  };

  const removeCommand = (projectName: string, id: number) => {
    setProjectsCommands((prevCommands: ProjectCommand[]) => {
      return prevCommands.map((prevCommand: ProjectCommand) => {
        if (prevCommand.projectName === projectName) {
          return {
            projectName,
            commands: prevCommand.commands.filter((cmd: Command) => cmd.id !== id),
          };
        } else {
          return prevCommand;
        }
      });
    });
  };

  return (
    <CommandContext.Provider value={{ projectsCommands, addCommand, removeCommand, updateCommand }}>
      {children}
    </CommandContext.Provider>
  );
};

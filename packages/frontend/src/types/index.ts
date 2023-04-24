export interface HostVariable {
  type: string;
  pathInProject: string;
  values: string;
  updated?: boolean;
  error?: string;
}

export interface CommitResponse {
  error: string | boolean;
  pullRequestUrl?: any;
}

export interface RunCommandOutput {
  success: boolean;
  output: string;
}

export interface CommandExecution {
  id: number;
  projectName: string;
  success: boolean;
  alias: string;
  command: string;
  output: string;
  executionDate: Date;
}

export interface RepositoryActionResult {
  success: boolean;
  error?: string;
}

export interface ProjectHosts {
  project: string;
  hosts: string[];
}

export interface HostDetails {
  inventoryType: string;
  groupName: string;
  variables: HostVariable[];
}

export interface HostDetailsResponse {
  hostDetailsByInventoryType: HostDetails[];
  projectExists: boolean;
  hostExists: boolean;
}

export interface ProjectDetailsHost {
  hostname: string;
  appliedVariables: string;
}

export interface ProjectDetailsGroup {
  groupName: string;
  hosts: ProjectDetailsHost[];
}

export interface ProjectDetailsInventory {
  inventoryType: string;
  inventoryPath: string;
  groupHosts: ProjectDetailsGroup[];
}

export interface ProjectDetailsResponse {
  projectDetails: ProjectDetailsInventory[];
  projectExists: boolean;
}

export interface ProjectPlaybook {
  playbookName: string;
  content: string;
}

export interface ProjectMainBranch {
  mainBranchName: null | string;
  projectExists: boolean;
}

export interface ProjectDetailsAndPlaybooks extends ProjectDetailsResponse {
  projectPlaybooks: ProjectPlaybook[];
}

export interface ChartData {
  [date: string]: {
    date: string;
    errors: number;
    successes: number;
  };
}

export interface Host {
  hostname: string;
  hostDetailsByInventoryType: HostDetails[];
}

export interface Project {
  projectName: string;
  hosts: Host[];
}

export interface TreeViewInventoryItem {
  id: string;
  name: string;
  children?: TreeViewInventoryItem[];
  appliedVariables?: string;
}

export interface ReducerAction {
  type: string;
  payload?: any;
}

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

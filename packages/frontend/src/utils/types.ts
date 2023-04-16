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
  groupHosts: ProjectDetailsGroup[];
}

export type ProjectDetails = ProjectDetailsInventory[];

export interface ProjectHosts {
  project: string;
  hosts: string[];
}

export interface HostVariable {
  type: string;
  pathInProject: string;
  values: string;
  updated?: boolean;
}

export interface HostDetails {
  inventoryType: string;
  groupName: string;
  variables: HostVariable[];
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

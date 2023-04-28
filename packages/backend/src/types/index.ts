/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

export interface HostVariable {
  type: string;
  pathInProject: string;
  values: string;
  updated?: boolean;
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
export interface ProjectDetailsAndPlaybooks extends ProjectDetailsResponse {
  projectPlaybooks: ProjectPlaybook[];
}

export interface ProjectMainBranch {
  mainBranchName: null | string;
  projectExists: boolean;
}

import { HostDetails } from '@frontend/types';

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

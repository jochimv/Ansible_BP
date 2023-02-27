interface ProjectHosts {
  inventoryPath: string;
  project: string;
  hosts: [];
}

export interface ProjectsHosts extends Array<ProjectHosts> {}

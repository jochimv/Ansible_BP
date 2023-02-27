interface ProjectHosts {
  project: string;
  hosts: [];
}

export interface ProjectsHosts extends Array<ProjectHosts> {}

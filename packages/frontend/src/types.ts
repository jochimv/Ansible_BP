export interface AutocompleteProjectHosts {
  project: string;
  host: string;
}

export interface AutocompleteProjectsHosts extends Array<AutocompleteProjectHosts> {}

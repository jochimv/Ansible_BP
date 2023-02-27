import axios from 'axios';
import { useQuery, UseQueryResult } from 'react-query';
import { ProjectsHosts } from '@backend/types';
import { AutocompleteProjectHosts } from '@frontend/types';

const transformForAutocomplete = (arr: ProjectsHosts = []): AutocompleteProjectHosts[] => {
  const autocompleteProjectHosts: AutocompleteProjectHosts[] = [];
  arr.forEach((obj) => {
    obj.hosts.forEach((host) => {
      autocompleteProjectHosts.push({ project: obj.project, host });
    });
  });
  return autocompleteProjectHosts;
};

const fetchInventoryFilesPaths = () => {
  return axios.get('http://localhost:4000/projects');
};

const useAutocompleteProjectsHosts = (): UseQueryResult<AutocompleteProjectHosts[], unknown> =>
  useQuery('inventory-files', fetchInventoryFilesPaths, {
    select: (data) => transformForAutocomplete(data.data),
  });

export default useAutocompleteProjectsHosts;

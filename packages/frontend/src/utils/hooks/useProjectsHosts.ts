import axios from 'axios';
import { useQuery, UseQueryResult } from 'react-query';
import { AutocompleteProjectHosts } from '@frontend/types';

const fetchInventoryFilesPaths = () => {
  return axios.get('http://localhost:4000/projects');
};

const useProjectsHosts = (options: any): UseQueryResult<AutocompleteProjectHosts[], unknown> =>
  useQuery('inventory-files', fetchInventoryFilesPaths, options);

export default useProjectsHosts;

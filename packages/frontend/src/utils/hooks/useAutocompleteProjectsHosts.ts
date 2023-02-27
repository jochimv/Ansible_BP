import { ProjectsHosts } from '@backend/types';
import { AutocompleteProjectHosts } from '@frontend/types';
import useProjectsHosts from './useProjectsHosts';

const transformForAutocomplete = (arr: ProjectsHosts = []): AutocompleteProjectHosts[] => {
  const autocompleteProjectHosts: AutocompleteProjectHosts[] = [];
  arr.forEach((obj) => {
    obj.hosts.forEach((host) => {
      autocompleteProjectHosts.push({ project: obj.project, host });
    });
  });
  return autocompleteProjectHosts;
};

const useAutocompleteProjectsHosts = () =>
  useProjectsHosts({
    select: (data: any) => transformForAutocomplete(data.data),
  });

export default useAutocompleteProjectsHosts;

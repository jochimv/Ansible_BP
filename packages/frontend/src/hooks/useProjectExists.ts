import { useQuery } from 'react-query';
import axios from 'axios';
import { BE_IP_ADDRESS } from '@frontend/constants';

export const fetchProjectExists = async (projectName: string) =>
  await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/exists`);
export const useProjectExists = (projectName: string | string[] | undefined) =>
  useQuery(['project-exists', projectName], () => {
    if (typeof projectName === 'string') {
      return fetchProjectExists(projectName);
    }
  });

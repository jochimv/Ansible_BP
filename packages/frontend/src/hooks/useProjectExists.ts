/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { useQuery } from 'react-query';
import axios from 'axios';
import { BE_BASE_URL } from '@frontend/constants';

export const fetchProjectExists = async (projectName: string) => await axios.get(`${BE_BASE_URL}/${projectName}/exists`);
export const useProjectExists = (projectName: string | string[] | undefined) =>
  useQuery(['project-exists', projectName], () => {
    if (typeof projectName === 'string') {
      return fetchProjectExists(projectName);
    }
  });

import { UseQueryResult, useQuery } from 'react-query';
import { HostDetailsResponse } from '@frontend/types';
import axios, { AxiosResponse } from 'axios';
import { BE_BASE_URL } from '@frontend/constants';

interface UseFetchHostDetailsProps {
  projectName: string | string[] | undefined;
  hostname: string | string[] | undefined;
}

const fetchHostDetails = async ({ projectName, hostname }: UseFetchHostDetailsProps): Promise<HostDetailsResponse> => {
  const response: AxiosResponse = await axios.get(`${BE_BASE_URL}/${projectName}/host-details/${hostname}`);
  return response.data;
};

const useFetchHostDetails = ({ projectName, hostname }: UseFetchHostDetailsProps): UseQueryResult<HostDetailsResponse> =>
  useQuery(
    ['hostDetails', { projectName, hostname }],
    () => {
      if (typeof projectName === 'string' && typeof hostname === 'string') {
        return fetchHostDetails({ projectName, hostname });
      }
    },
    {
      enabled: !!projectName && !!hostname,
      refetchOnWindowFocus: false,
      cacheTime: 0,
    },
  );

export default useFetchHostDetails;

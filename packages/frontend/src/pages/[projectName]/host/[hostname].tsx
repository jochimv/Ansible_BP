import { useQuery } from 'react-query';
import { useRouter } from 'next/router';
import axios, { AxiosResponse } from 'axios';
import { Stack } from '@mui/material';
import { useCodeChangesDispatchContext } from '@frontend/context/CodeChangesContext';
import { initializeEditor } from '@frontend/reducers/codeChangesReducer';
import HostNotFound from '@frontend/components/HostNotFound';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import LoadingPage from '@frontend/components/Loading';
import { HostDetailsResponse } from '@frontend/types';
import { BE_IP_ADDRESS } from '@frontend/constants';
import HostInfoBox from '@frontend/components/HostInfoBox';
import EditorWrapper from '@frontend/components/EditorWrapper';
import EditorInfoSnackbar from '@frontend/components/EditorInfoSnackbar';

const fetchHostDetails = async (
  projectName: string,
  hostname: string | string[],
): Promise<HostDetailsResponse> => {
  const response: AxiosResponse<any> = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/host/${hostname}`,
  );
  return response.data;
};

const HostDetailsPage = () => {
  const router = useRouter();
  const { projectName, hostname } = router.query;
  const dispatch = useCodeChangesDispatchContext();

  const {
    isLoading: hostDataLoading,
    isSuccess,
    data,
  } = useQuery(
    ['hostDetails', { projectName, hostname }],
    () => {
      if (typeof projectName === 'string' && typeof hostname === 'string') {
        return fetchHostDetails(projectName, hostname);
      }
    },
    {
      enabled: !!projectName && !!hostname,
      refetchOnWindowFocus: false,
      onSuccess: (response: HostDetailsResponse) => {
        const { hostDetailsByInventoryType, projectExists, hostExists } = response;
        if (projectExists && hostExists) {
          dispatch(
            initializeEditor({
              hostDetailsByInventoryType,
              projectName,
              hostname,
            }),
          );
        }
      },
    },
  );

  if (hostDataLoading || !projectName || !hostname || !isSuccess) {
    return <LoadingPage />;
  }

  const { projectExists, hostExists } = data || {};

  if (!projectExists) {
    return <ProjectNotFound />;
  } else if (!hostExists) {
    return <HostNotFound />;
  }

  return (
    <Stack direction="row" sx={{ height: '100%' }}>
      <HostInfoBox />
      <EditorWrapper />
      <EditorInfoSnackbar />
    </Stack>
  );
};

export default HostDetailsPage;

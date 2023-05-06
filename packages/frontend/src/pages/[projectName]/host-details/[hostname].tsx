/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Details: A page showing info for given host, (project name, group name, inventories, etc.), with an editor
 *          showing different variables (applied, common, group, host). All variable files except applied are editable,
 */

import { useRouter } from 'next/router';
import { Stack } from '@mui/material';
import HostNotFound from '@frontend/components/HostNotFound';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import LoadingPage from '@frontend/components/Loading';
import HostInfoBox from '@frontend/components/HostInfoBox';
import EditorWrapper from '@frontend/components/EditorWrapper';
import EditorInfoSnackbar from '@frontend/components/EditorInfoSnackbar';
import ErrorPage from '@frontend/components/ErrorPage';
import useFetchHostDetails from '@frontend/hooks/useFetchHostDetails';
//importy
const HostDetailsPage = () => {
  const router = useRouter();
  // extrakce segmentů URL adresy
  const { projectName, hostname } = router.query;

  // použití segmentů k zavolání back-endu k získání detailů hosta
  const { isLoading, isError, data: response, error } = useFetchHostDetails({ projectName, hostname });

  // vyobrazení patřičné stránky
  if (isLoading || !projectName || !hostname) {
    return <LoadingPage />;
  } else if (isError && error instanceof Error) {
    return <ErrorPage errorMessage={error.message} />;
  }

  const { projectExists, hostExists } = response!;

  if (!projectExists) {
    return <ProjectNotFound />;
  } else if (!hostExists) {
    return <HostNotFound />;
  }

  return (
    <Stack direction="row" height="100%">
      <HostInfoBox />
      <EditorWrapper />
      <EditorInfoSnackbar />
    </Stack>
  );
};

export default HostDetailsPage;

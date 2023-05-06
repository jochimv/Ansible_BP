/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Details: Server structure page showing structure of inventories, groups, and servers, with a search option and applied variables.
 */

import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import { useQuery } from 'react-query';
import LoadingPage from '@frontend/components/Loading';
import { convertProjectDetailsToTreeOfIds } from '@frontend/utils';
import { useUpdatedProjectDetails } from '@frontend/hooks/useUpdatedProjectDetails';
import NoServersFound from '@frontend/components/NoServersFound';
import { ProjectDetailsResponse } from '@frontend/types';
import axios from 'axios';
import { BE_BASE_URL } from '@frontend/constants';

export const getProjectDetails = async (projectName: string): Promise<ProjectDetailsResponse> => {
  const data = await axios.get(`${BE_BASE_URL}/${projectName}/server-structure`);
  return data.data;
};
const ProjectPage = () => {
  const { projectName } = useRouter().query;
  const [selectedHost, setSelectedHost] = useState({ id: '', name: '', appliedVariables: '' });

  const { data, isLoading } = useQuery(
    ['projectDetails', projectName],
    () => {
      if (typeof projectName === 'string') {
        return getProjectDetails(projectName);
      }
    },
    {
      enabled: !!projectName,
    },
  );

  const projectDetails = data?.projectDetails || [];

  const updatedProjectDetails = useUpdatedProjectDetails(projectDetails, projectName);

  useEffect(() => {
    if (!isLoading && projectName && data) {
      const { projectExists } = data;
      if (projectExists) {
        const treeData = convertProjectDetailsToTreeOfIds(updatedProjectDetails);
        setSelectedHost(treeData[0]?.children[0]?.children[0]);
      }
    }
  }, [isLoading, projectName, data]);

  const treeData = convertProjectDetailsToTreeOfIds(updatedProjectDetails);

  if (isLoading || !projectName || !data) {
    return <LoadingPage />;
  } else if (!data.projectExists) {
    return <ProjectNotFound />;
  } else if (!selectedHost) {
    return <NoServersFound />;
  }

  return (
    <Stack height="100%">
      <Stack direction="row" height="100%" display="flex">
        <Box width="30%" height="100%">
          <ProjectDetailsTree data={treeData} onNodeSelected={setSelectedHost} />
        </Box>
        <Box height="100%" width="70%" alignItems="center" justifyContent="center" display="flex">
          {selectedHost && selectedHost.appliedVariables === '{}\n' ? (
            <Typography variant="h4">No variables to show</Typography>
          ) : (
            <Editor defaultLanguage="yaml" value={selectedHost ? selectedHost.appliedVariables : ''} options={{ readOnly: true }} />
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default ProjectPage;

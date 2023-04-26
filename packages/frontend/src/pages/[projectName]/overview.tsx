import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import { useQuery } from 'react-query';
import LoadingPage from '@frontend/components/Loading';
import { convertProjectDetailsToTreeOfIds, getProjectDetails } from '@frontend/utils';
import { useUpdatedProjectDetails } from '@frontend/hooks/useUpdatedProjectDetails';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { notFoundIconSx } from '@frontend/constants';
import NoServersFound from '@frontend/components/NoServersFound';

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
    <Stack sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ height: '100%', display: 'flex' }}>
        <Box sx={{ width: '30%', height: '100%' }}>
          <ProjectDetailsTree data={treeData} onNodeSelected={setSelectedHost} />
        </Box>
        <Box sx={{ width: '70%', height: '100%' }}>
          <Editor
            defaultLanguage="yaml"
            value={selectedHost ? selectedHost.appliedVariables : ''}
            options={{ readOnly: true }}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default ProjectPage;

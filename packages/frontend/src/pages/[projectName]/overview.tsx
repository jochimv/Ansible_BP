import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import { useCodeChangesContext } from '@frontend/context/CodeChangesContext';
import { useQuery } from 'react-query';
import LoadingPage from '@frontend/components/Loading';
import {
  convertProjectDetailsToTreeOfIds,
  getProjectDetails,
  updateAppliedVariables,
} from '@frontend/utils';

const ProjectPage = () => {
  const { projectName } = useRouter().query;
  const { updatedProjects } = useCodeChangesContext();

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

  const [selectedHost, setSelectedHost] = useState({ id: '', name: '', appliedVariables: '' });

  useEffect(() => {
    if (!isLoading && projectName && data) {
      const { projectDetails, projectExists } = data;

      if (projectExists) {
        const newProjectDetails = updateAppliedVariables(
          projectDetails,
          updatedProjects,
          projectName,
        );
        const treeData = convertProjectDetailsToTreeOfIds(newProjectDetails);
        setSelectedHost(treeData[0].children[0].children[0]);
      }
    }
  }, [isLoading, projectName, data, updatedProjects]);

  if (isLoading || !projectName || !data) {
    return <LoadingPage />;
  }
  if (!data.projectExists) {
    return <ProjectNotFound />;
  }

  const { projectDetails } = data;
  const treeData = convertProjectDetailsToTreeOfIds(
    updateAppliedVariables(projectDetails, updatedProjects, projectName),
  );

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

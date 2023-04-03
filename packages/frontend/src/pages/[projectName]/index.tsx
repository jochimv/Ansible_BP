import { useRouter } from 'next/router';
import { Stack, Typography } from '@mui/material';
import { getProjectDetails } from '@frontend/utils';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { FolderOffOutlined } from '@mui/icons-material';
import ProjectNotFound from '@frontend/components/notFoundPages/ProjectNotFound';

const convertData = (data) => {
  return data.flatMap(({ inventoryType, groupHosts }, idx) => {
    return {
      id: `inventory-${idx}`,
      name: inventoryType,
      children: groupHosts.flatMap(({ groupName, hosts }, groupIdx) => {
        return {
          id: `group-${idx}-${groupIdx}`,
          name: groupName,
          children: hosts.map(({ hostname, appliedVariables }, hostIdx) => ({
            id: `host-${idx}-${groupIdx}-${hostIdx}`,
            name: hostname,
            appliedVariables,
          })),
        };
      }),
    };
  });
};
const ProjectPage = ({ projectDetails }) => {
  if (!projectDetails) {
    return <ProjectNotFound />;
  }
  const router = useRouter();
  const treeData = convertData(projectDetails);
  const [selectedHost, setSelectedHost] = useState(treeData[0].children[0].children[0]);

  return (
    <Stack sx={{ height: '100%' }}>
      <Typography variant="h4">{router.query.projectName}</Typography>
      <Stack direction="row" sx={{ height: '100%' }}>
        <ProjectDetailsTree data={treeData} onNodeSelected={setSelectedHost} />
        <Editor
          defaultLanguage="yaml"
          value={selectedHost ? selectedHost.appliedVariables : ''}
          options={{ readOnly: true }}
        />
      </Stack>
    </Stack>
  );
};

export async function getServerSideProps(context: any) {
  const { projectName } = context.query;

  const projectDetails = getProjectDetails(projectName);

  return {
    props: { projectDetails },
  };
}

export default ProjectPage;

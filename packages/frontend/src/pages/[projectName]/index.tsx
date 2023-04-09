import { useRouter } from 'next/router';
import { Stack, Typography } from '@mui/material';
import { getProjectDetails } from '@frontend/utils';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import ProjectNotFound from '@frontend/components/notFoundPages/ProjectNotFound';
import { useCodeChangesContext } from '@frontend/codeChanges/CodeChangesContext';
import { parse as parseYaml, stringify } from 'yaml';

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
export const getStringifiedVariablesFromVariablesArray = (variables) => {
  const commonVariables = variables.find((variable) => variable.type === 'common');
  const groupVariables = variables.find((variable) => variable.type === 'group');
  const hostVariables = variables.find((variable) => variable.type === 'host');

  try {
    const appliedVariables = {
      ...(commonVariables && parseYaml(commonVariables.values)),
      ...(groupVariables && parseYaml(groupVariables.values)),
      ...(hostVariables && parseYaml(hostVariables.values)),
    };

    const stringifiedAppliedVariables = stringify(appliedVariables);
    return stringifiedAppliedVariables === '{}\n' ? '' : stringifiedAppliedVariables;
  } catch (e) {
    // todo  tohle
    return variable;
  }
};

function updateAppliedVariables(projectDetails, updatedProjects, projectName) {
  const updatedDetails = JSON.parse(JSON.stringify(projectDetails));

  const updatedProject = updatedProjects.find((project) => project.projectName === projectName);
  updatedDetails?.forEach((detail) => {
    detail?.groupHosts.forEach((groupHost) => {
      groupHost?.hosts?.forEach((host) => {
        const inventoryType = detail.inventoryType;
        const groupName = groupHost.groupName;
        const hostname = host.hostname;
        let hostVariables;
        let groupVariables;
        let commonVariables;
        const sourceForAppliedVariables = [];
        updatedProject?.hosts.forEach((host) => {
          host?.hostDetailsByInventoryType.forEach((hostDetail) => {
            if (
              host.hostname === hostname &&
              hostDetail.inventoryType === inventoryType &&
              hostDetail.groupName === groupName
            ) {
              hostVariables = hostDetail.variables.find((variable) => variable.type === 'host');
              groupVariables = hostDetail.variables.find((variable) => variable.type === 'group');
              commonVariables = hostDetail.variables.find((variable) => variable.type === 'common');
            } else if (
              hostDetail.inventoryType === inventoryType &&
              hostDetail.groupName === groupName
            ) {
              groupVariables = hostDetail.variables.find((variable) => variable.type === 'group');
              commonVariables = hostDetail.variables.find((variable) => variable.type === 'common');
            } else if (hostDetail.inventoryType === inventoryType) {
              commonVariables = hostDetail.variables.find((variable) => variable.type === 'common');
            }
          });
        });
        if (hostVariables) {
          sourceForAppliedVariables.push(hostVariables);
        }
        if (groupVariables) {
          sourceForAppliedVariables.push(groupVariables);
        }
        if (commonVariables) {
          sourceForAppliedVariables.push(commonVariables);
        }
        if (sourceForAppliedVariables.length !== 0) {
          host.appliedVariables =
            getStringifiedVariablesFromVariablesArray(sourceForAppliedVariables);
        }
      });
    });
  });
  return updatedDetails;
}

const ProjectPage = ({ projectDetails, projectExists }) => {
  if (!projectExists) {
    return <ProjectNotFound />;
  }
  const router = useRouter();
  const { projectName } = router.query;

  const { updatedProjects } = useCodeChangesContext();

  const newProjectDetails = updateAppliedVariables(projectDetails, updatedProjects, projectName);

  const treeData = convertData(newProjectDetails);
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

  const { projectDetails, projectExists } = await getProjectDetails(projectName);

  return {
    props: { projectDetails, projectExists },
  };
}

export default ProjectPage;

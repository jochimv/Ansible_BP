import { useRouter } from 'next/router';
import { Stack, Typography } from '@mui/material';
import { getProjectDetails } from '@frontend/utils';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { SyntheticEvent, useState } from 'react';
import ProjectNotFound from '@frontend/components/notFoundPages/ProjectNotFound';
import { useCodeChangesContext } from '@frontend/codeChanges/CodeChangesContext';
import { parse as parseYaml, stringify } from 'yaml';
import {
  Host,
  HostDetails,
  HostVariable,
  Project,
  ProjectDetails,
  ProjectDetailsGroup,
  ProjectDetailsHost,
  ProjectDetailsInventory,
} from '@frontend/utils/types';

const convertProjectDetailsToTreeOfIds = (projectDetails: ProjectDetails) => {
  return projectDetails.flatMap(
    ({ inventoryType, groupHosts }: ProjectDetailsInventory, idx: number) => {
      return {
        id: `inventory-${idx}`,
        name: inventoryType,
        children: groupHosts.flatMap(
          ({ groupName, hosts }: ProjectDetailsGroup, groupIdx: number) => {
            return {
              id: `group-${idx}-${groupIdx}`,
              name: groupName,
              children: hosts.map(
                ({ hostname, appliedVariables }: ProjectDetailsHost, hostIdx: number) => ({
                  id: `host-${idx}-${groupIdx}-${hostIdx}`,
                  name: hostname,
                  appliedVariables,
                }),
              ),
            };
          },
        ),
      };
    },
  );
};
export const getStringifiedAppliedVariablesFromVariablesArray = (
  variables: HostVariable[],
  originalAppliedVariables: string,
) => {
  const commonVariables = variables.find((variable: HostVariable) => variable.type === 'common');
  const groupVariables = variables.find((variable: HostVariable) => variable.type === 'group');
  const hostVariables = variables.find((variable: HostVariable) => variable.type === 'host');
  const appliedVariables = {
    ...(commonVariables && parseYaml(commonVariables.values)),
    ...(groupVariables && parseYaml(groupVariables.values)),
    ...(hostVariables && parseYaml(hostVariables.values)),
  };
  if ('0' in appliedVariables) {
    return originalAppliedVariables;
  }
  const stringifiedAppliedVariables = stringify(appliedVariables);
  return stringifiedAppliedVariables === '{}\n' ? '' : stringifiedAppliedVariables;
};

const updateAppliedVariables = (
  projectDetails: ProjectDetails,
  updatedProjects: Project[],
  projectName: string | string[] | undefined,
) => {
  const updatedDetails = JSON.parse(JSON.stringify(projectDetails));

  const updatedProject = updatedProjects.find(
    (project: Project) => project.projectName === projectName,
  );
  updatedDetails?.forEach((detail: ProjectDetailsInventory) => {
    detail?.groupHosts.forEach((groupHost: ProjectDetailsGroup) => {
      groupHost?.hosts?.forEach((host: ProjectDetailsHost) => {
        const inventoryType = detail.inventoryType;
        const groupName = groupHost.groupName;
        const hostname = host.hostname;
        let hostVariables;
        let groupVariables;
        let commonVariables;
        const sourceForAppliedVariables: HostVariable[] = [];
        updatedProject?.hosts.forEach((host: Host) => {
          host?.hostDetailsByInventoryType.forEach((hostDetail: HostDetails) => {
            if (
              host.hostname === hostname &&
              hostDetail.inventoryType === inventoryType &&
              hostDetail.groupName === groupName
            ) {
              hostVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'host',
              );
              groupVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'group',
              );
              commonVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'common',
              );
            } else if (
              hostDetail.inventoryType === inventoryType &&
              hostDetail.groupName === groupName
            ) {
              groupVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'group',
              );
              commonVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'common',
              );
            } else if (hostDetail.inventoryType === inventoryType) {
              commonVariables = hostDetail.variables.find(
                (variable: HostVariable) => variable.type === 'common',
              );
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
          host.appliedVariables = getStringifiedAppliedVariablesFromVariablesArray(
            sourceForAppliedVariables,
            host.appliedVariables,
          );
        }
      });
    });
  });
  return updatedDetails;
};

const ProjectPage = ({
  projectDetails,
  projectExists,
}: {
  projectDetails: ProjectDetails;
  projectExists: boolean;
}) => {
  if (!projectExists) {
    return <ProjectNotFound />;
  }
  const { projectName } = useRouter().query!;
  const { updatedProjects } = useCodeChangesContext();
  const newProjectDetails = updateAppliedVariables(projectDetails, updatedProjects, projectName);

  const treeData = convertProjectDetailsToTreeOfIds(newProjectDetails);
  const [selectedHost, setSelectedHost] = useState(treeData[0].children[0].children[0]);

  return (
    <Stack sx={{ height: '100%' }}>
      <Typography variant="h4">{projectName}</Typography>
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

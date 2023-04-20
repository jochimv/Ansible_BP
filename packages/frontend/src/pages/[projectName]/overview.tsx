import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import ProjectDetailsTree from '@frontend/components/ProjectDetailsTree';
import Editor from '@monaco-editor/react';
import { useState, useEffect } from 'react';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
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
import axios from 'axios';
import { useQuery } from 'react-query';
import LoadingPage from '@frontend/components/pages/Loading';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';

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

const getProjectDetails = async (projectName: string) => {
  const data = await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/details`);
  return data.data;
};

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
      <Typography variant="h4">{projectName}</Typography>
      <Stack direction="row" sx={{ height: 'calc(100% - 40px)', display: 'flex' }}>
        <Box sx={{ width: '30%', height: '100%' }}>
          <ProjectDetailsTree data={treeData} onNodeSelected={setSelectedHost} />
        </Box>
        <Box sx={{ width: '70%' }}>
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

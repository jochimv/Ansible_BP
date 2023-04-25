import {
  Host,
  HostDetails,
  HostVariable,
  Project,
  ProjectDetailsGroup,
  ProjectDetailsHost,
  ProjectDetailsInventory,
  ProjectDetailsResponse,
  TreeViewInventoryItem,
} from '@frontend/types';
import axios from 'axios';
import { parse as parseYaml, stringify } from 'yaml';
import { Breadcrumbs, Typography } from '@mui/material';
import { CodeChangesState } from '@frontend/reducers/codeChangesReducer';
import { BE_IP_ADDRESS } from '@frontend/constants';
import { TreeItem } from '@mui/lab';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

export const convertProjectDetailsToTreeOfIds = (projectDetails: ProjectDetailsInventory[]) => {
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
export const findServerVariables = (
  host: Host,
  inventoryType: string,
  groupName: string,
  hostname: string,
): {
  hostVariables: HostVariable | undefined;
  groupVariables: HostVariable | undefined;
  commonVariables: HostVariable | undefined;
} => {
  let hostVariables, groupVariables, commonVariables;

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
    } else if (hostDetail.inventoryType === inventoryType && hostDetail.groupName === groupName) {
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
  return { hostVariables, groupVariables, commonVariables };
};

export const getProjectDetails = async (projectName: string): Promise<ProjectDetailsResponse> => {
  const data = await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/details`);
  return data.data;
};
export const getVariablesByType = (obj: any, type: string) => {
  const variablesArray = obj.variables;
  for (let i = 0; i < variablesArray.length; i++) {
    if (variablesArray[i].type === type) {
      return variablesArray[i];
    }
  }
  return null;
};
export const renderBreadcrumbsSegments = (path: string) => {
  const segments = path.split('\\');
  return segments.map((segment: string, index: number) => (
    <Typography key={index}>{segment}</Typography>
  ));
};
export const formatErrorMessage = (message: string): JSX.Element => {
  const lines = message.split('\n');
  return (
    <div>
      {lines.map((line: string, index: number) => (
        <div key={index}>{line || '\u00A0'}</div>
      ))}
    </div>
  );
};
export const getUpdatedFilesPaths = (projects: Project[], projectName: string | null): string[] => {
  return (
    projects
      ?.filter(({ projectName: proj }) => proj === projectName)
      .flatMap(({ hosts }: { hosts: Host[] }) =>
        hosts.flatMap(
          ({ hostDetailsByInventoryType }: { hostDetailsByInventoryType: HostDetails[] }) =>
            hostDetailsByInventoryType.flatMap(({ variables }: { variables: HostVariable[] }) =>
              variables
                .filter(({ type, updated }) => type !== 'applied' && updated)
                .map(({ pathInProject }) => pathInProject),
            ),
        ),
      )
      .filter(
        (pathInProject: string, index: number, self: string[]) =>
          self.indexOf(pathInProject) === index,
      ) || []
  );
};
export const projectHasUpdatedVariables = (project: Project) => {
  for (const host of project.hosts) {
    for (const inventoryType of host.hostDetailsByInventoryType) {
      for (const variable of inventoryType.variables) {
        if (variable.updated && variable.type !== 'applied') {
          return true;
        }
      }
    }
  }
  return false;
};
export const processVariables = (
  variable: Omit<any, 'updated'> | HostVariable,
  commonVariables: Omit<any, 'updated'> | undefined,
  groupVariables: Omit<any, 'updated'> | undefined,
  hostVariables: Omit<any, 'updated'> | undefined,
) => {
  try {
    const appliedVariables = {
      ...(commonVariables && parseYaml(commonVariables.values)),
      ...(groupVariables && parseYaml(groupVariables.values)),
      ...(hostVariables && parseYaml(hostVariables.values)),
    };

    const stringifiedAppliedVariables = stringify(appliedVariables);
    const appliedVariablesToShow =
      stringifiedAppliedVariables === '{}\n' ? '' : stringifiedAppliedVariables;

    return {
      ...variable,
      values: appliedVariablesToShow,
    };
  } catch (e) {
    return variable;
  }
};
export const findVariableObject = (
  projects: Project[],
  path: string,
  projectName: string,
  hostname: string,
): HostVariable | undefined => {
  const project = projects.find((p) => p.projectName === projectName);

  if (!project) {
    return undefined;
  }

  const host = project.hosts.find((h) => h.hostname === hostname);

  if (!host) {
    return undefined;
  }

  for (const inventoryType of host.hostDetailsByInventoryType) {
    const variableObject = inventoryType.variables.find(
      (v: HostVariable) => v.pathInProject === path,
    );

    if (variableObject) {
      return variableObject;
    }
  }
  return undefined;
};
export const findHostDetailsByInventoryType = (
  projectName: string,
  hostname: string,
  updatedProjects: Project[],
) => {
  for (let i = 0; i < updatedProjects?.length; i++) {
    const project = updatedProjects[i];
    if (project.projectName === projectName) {
      for (let j = 0; j < project.hosts.length; j++) {
        const host = project.hosts[j];
        if (host.hostname === hostname) {
          return host.hostDetailsByInventoryType;
        }
      }
    }
  }
  return null;
};
export const replaceVariableInProjectsArray = (
  newVariable: HostVariable,
  projects: Project[],
): Project[] | undefined => {
  return projects.map((project: Project) => ({
    ...project,
    hosts: project.hosts.map((host: Host) => ({
      ...host,
      hostDetailsByInventoryType: host.hostDetailsByInventoryType.map(
        (hostDetails: HostDetails) => {
          let hostDetailVariablesChanged;
          const updatedVariables = hostDetails.variables.map((variable) => {
            if (variable.pathInProject === newVariable.pathInProject) {
              hostDetailVariablesChanged = true;
              return newVariable;
            } else {
              return variable;
            }
          });

          let updatedVariablesAll = updatedVariables;
          if (hostDetailVariablesChanged) {
            //@ts-ignore
            updatedVariablesAll = updatedVariables.map((variable: HostVariable) => {
              if (variable.type === 'applied') {
                const commonVariables = updatedVariables.find(
                  (variable: HostVariable) => variable.type === 'common',
                );
                const groupVariables = updatedVariables.find(
                  (variable: HostVariable) => variable.type === 'group',
                );
                const hostVariables = updatedVariables.find(
                  (variable: HostVariable) => variable.type === 'host',
                );

                return processVariables(variable, commonVariables, groupVariables, hostVariables);
              } else {
                return variable;
              }
            });
          }

          return {
            ...hostDetails,
            variables: updatedVariablesAll,
          };
        },
      ),
    })),
  }));
};
export const getProjectUpdatedVars = (project: any): any[] => {
  return (
    project?.hosts?.flatMap((host: Host) =>
      host.hostDetailsByInventoryType.flatMap((hostDetailByInventoryType: HostDetails) =>
        hostDetailByInventoryType.variables.filter(
          (variable: HostVariable) => variable.updated && variable.type !== 'applied',
        ),
      ),
    ) || []
  );
};
export const getAllUpdatedVars = (updatedProjects: Project[]): any[] => {
  return (
    updatedProjects
      ?.map((updatedProject: Project) => getProjectUpdatedVars(updatedProject))
      .flat() || []
  );
};
export const extractOriginalStateValues = (
  state: CodeChangesState,
  projectName: string,
  hostname: string,
) => {
  const selectedHostDetailsByInventoryType = state.originalProjects
    .find((project: Project) => project.projectName === projectName)
    ?.hosts.find((host: Host) => host.hostname === hostname)?.hostDetailsByInventoryType;
  const selectedHostDetails = selectedHostDetailsByInventoryType?.find(
    (selectedHostDetail: HostDetails) =>
      selectedHostDetail.inventoryType === state.selectedHostDetails?.inventoryType,
  );
  const selectedVariables = selectedHostDetails?.variables.find(
    (variable: HostVariable) => variable.type === state.selectedVariables.type,
  );
  return {
    selectedHostDetailsByInventoryType,
    selectedHostDetails,
    selectedVariables,
  };
};
export const tryToParseYml = (newEditorValue: string): string | undefined => {
  try {
    const parsedYml = parseYaml(newEditorValue);
    if ('0' in parsedYml) {
      return 'Unfinished key';
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return e.message;
    } else {
      return String(e);
    }
  }
};
export const filterTreeItems = (
  nodes: TreeViewInventoryItem[],
  searchTerm: string,
): TreeViewInventoryItem[] => {
  return nodes
    .map((node: TreeViewInventoryItem) => {
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return node;
      }
      if (Array.isArray(node.children)) {
        const filteredChildren = filterTreeItems(node.children, searchTerm);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter((node) => node !== null) as TreeViewInventoryItem[];
};
export const renderTree = (nodes: TreeViewInventoryItem) => {
  return (
    <TreeItem
      icon={
        Array.isArray(nodes.children) ? undefined : (
          <FontAwesomeIcon icon={faServer} style={{ color: 'gray' }} />
        )
      }
      key={nodes.id}
      nodeId={nodes.id}
      label={nodes.name}
    >
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );
};
export const countServers = (treeData: TreeViewInventoryItem[]): number => {
  let serverCount = 0;
  treeData.forEach((inventory: TreeViewInventoryItem) => {
    inventory.children?.forEach((group: TreeViewInventoryItem) => {
      serverCount += group.children?.length || 0;
    });
  });
  return serverCount;
};
export const findNode = (
  data: TreeViewInventoryItem[],
  nodeId: string,
): TreeViewInventoryItem | undefined => {
  for (const inventory of data) {
    for (const group of inventory?.children || []) {
      for (const host of group?.children || []) {
        if (host.id === nodeId) {
          return host;
        }
      }
    }
  }
};

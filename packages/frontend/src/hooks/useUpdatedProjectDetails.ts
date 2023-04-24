// hooks/useUpdatedProjectDetails.ts
import { useMemo } from 'react';
import {
  ProjectDetailsInventory,
  Project,
  ProjectDetailsGroup,
  ProjectDetailsHost,
  HostVariable,
  Host,
} from '@frontend/types';
import {
  findServerVariables,
  findVariableObject,
  getStringifiedAppliedVariablesFromVariablesArray,
} from '@frontend/utils';
import { useCodeChangesContext } from '@frontend/context/CodeChangesContext';

export const useUpdatedProjectDetails = (
  projectDetails: ProjectDetailsInventory[],
  projectName: string | string[] | undefined,
) => {
  const { updatedProjects, originalProjects } = useCodeChangesContext();
  return useMemo(() => {
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
          const sourceForAppliedVariables: HostVariable[] = [];

          updatedProject?.hosts.forEach((projectHost: Host) => {
            const { hostVariables, groupVariables, commonVariables } = findServerVariables(
              projectHost,
              inventoryType,
              groupName,
              hostname,
            );

            if (hostVariables && !hostVariables.error) {
              sourceForAppliedVariables.push(hostVariables);
            } else if (hostVariables && typeof projectName === 'string') {
              const variableObject = findVariableObject(
                originalProjects,
                hostVariables.pathInProject,
                projectName,
                hostname,
              );
              if (variableObject) {
                sourceForAppliedVariables.push(variableObject);
              }
            }

            if (groupVariables && !groupVariables.error) {
              sourceForAppliedVariables.push(groupVariables);
            } else if (groupVariables && typeof projectName === 'string') {
              const variableObject = findVariableObject(
                originalProjects,
                groupVariables.pathInProject,
                projectName,
                hostname,
              );
              if (variableObject) {
                sourceForAppliedVariables.push(variableObject);
              }
            }

            if (commonVariables && !commonVariables.error) {
              sourceForAppliedVariables.push(commonVariables);
            } else if (commonVariables && typeof projectName === 'string') {
              const variableObject = findVariableObject(
                originalProjects,
                commonVariables.pathInProject,
                projectName,
                hostname,
              );
              if (variableObject) {
                sourceForAppliedVariables.push(variableObject);
              }
            }
          });

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
  }, [projectDetails, projectName, originalProjects, updatedProjects]);
};

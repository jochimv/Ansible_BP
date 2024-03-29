/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import keyMirror from 'keymirror';
import { parse as parseYaml, stringify } from 'yaml';
import { omit } from 'ramda';
import { Host, HostDetails, HostVariable, Project, ReducerAction } from '@frontend/types';
import {
  extractOriginalStateValues,
  findHostDetailsByInventoryType,
  findNewStateVarsFromVariablesPath,
  findVariableObject,
  getAllUpdatedVars,
  getProjectUpdatedVars,
  processVariables,
  projectHasUpdatedVariables,
  replaceVariableInProjectsArray,
  tryToParseYml,
} from '@frontend/utils';

export interface CodeChangesState {
  selectedProjectName: string | null;
  isInEditMode: boolean;
  selectedHostDetailsByInventoryType: HostDetails[] | null | undefined;
  selectedHostDetails?: HostDetails | null | undefined;
  selectedVariables: any;
  originalVars: HostVariable[] | null | undefined;
  updatedVars: HostVariable[] | null | undefined;
  updatedProjects: Project[];
  originalProjects: Project[];
  originalDiff: HostVariable | null | undefined;
  updatedDiff: HostVariable | null | undefined;
  isInitializeEditorEnabled: boolean;
}
export const actionTypes = keyMirror({
  EDIT: null,
  SWITCH_MODE: null,
  SHOW_HOST_DETAILS: null,
  SHOW_VARIABLES: null,
  INITIALIZE_EDITOR: null,
  UPDATE_VARIABLES: null,
  CREATE_DIFF: null,
  SHOW_DIFF: null,
  ROLLBACK: null,
  SELECT_PROJECT: null,
  INITIALIZE_CONTEXT: null,
  CLEAR_PROJECT_UPDATES: null,
  OPEN_COMMIT_MODAL: null,
  CLOSE_COMMIT_MODAL: null,
  CLEAR_PROJECT_UPDATES_FROM_EDITOR: null,
  CLEAR_ALL_PROJECTS_UPDATES: null,
  CLEAR_ALL_PROJECT_UPDATES_FROM_EDITOR: null,
  DELETE_PROJECT: null,
  ENABLE_EDITOR_INITIALIZE: null,
});
export const initialState: CodeChangesState = {
  updatedProjects: [],
  originalProjects: [],
  isInEditMode: true,
  selectedHostDetails: null,
  selectedVariables: null,
  selectedHostDetailsByInventoryType: [],
  originalDiff: null,
  updatedDiff: null,
  originalVars: [],
  updatedVars: [],
  selectedProjectName: null,
  isInitializeEditorEnabled: true,
};

export const codeChangesReducer = (
  state: CodeChangesState = initialState,
  action: ReducerAction,
): CodeChangesState => {
  switch (action.type) {
    case actionTypes.ENABLE_EDITOR_INITIALIZE:
      return { ...state, isInitializeEditorEnabled: true };
    case actionTypes.EDIT: {
      const { path, navigate } = action.payload;
      const { selectedProjectName } = state;
      const {
        selectedHostDetailsByInventoryType,
        hostname,
        selectedHostDetails,
        selectedVariables,
      } = findNewStateVarsFromVariablesPath(selectedProjectName!, path, state.updatedProjects)!;
      navigate(`/${selectedProjectName}/host-details/${hostname}`);
      return {
        ...state,
        isInitializeEditorEnabled: false,
        selectedHostDetailsByInventoryType,
        selectedHostDetails,
        selectedVariables,
      };
    }
    case actionTypes.INITIALIZE_CONTEXT:
      return action.payload;
    case actionTypes.SELECT_PROJECT:
      return { ...state, selectedProjectName: action.payload };
    case actionTypes.SWITCH_MODE:
      return { ...state, isInEditMode: !state.isInEditMode };
    case actionTypes.SHOW_HOST_DETAILS:
      return { ...state, selectedHostDetails: action.payload };
    case actionTypes.SHOW_VARIABLES:
      return { ...state, selectedVariables: action.payload };
    case actionTypes.DELETE_PROJECT: {
      const projectName = action.payload;
      return {
        ...state,
        selectedProjectName: null,
        originalProjects: state.originalProjects.filter(
          (project: Project) => project.projectName !== projectName,
        ),
        updatedProjects: state.updatedProjects.filter(
          (project: Project) => project.projectName !== projectName,
        ),
      };
    }
    case actionTypes.CLEAR_ALL_PROJECT_UPDATES_FROM_EDITOR: {
      const { projectName, hostname } = action.payload;
      const { selectedHostDetailsByInventoryType, selectedHostDetails, selectedVariables } =
        extractOriginalStateValues(state, projectName, hostname);
      return {
        ...state,
        originalDiff: null,
        updatedDiff: null,
        updatedVars: [],
        selectedHostDetailsByInventoryType,
        selectedHostDetails,
        selectedVariables,
        updatedProjects: [],
      };
    }
    case actionTypes.CLEAR_PROJECT_UPDATES_FROM_EDITOR: {
      const { projectName, hostname } = action.payload;
      const { selectedHostDetailsByInventoryType, selectedHostDetails, selectedVariables } =
        extractOriginalStateValues(state, projectName, hostname);
      return {
        ...state,
        originalDiff: null,
        updatedDiff: null,
        updatedVars: [],
        selectedHostDetailsByInventoryType,
        selectedHostDetails,
        selectedVariables,
        updatedProjects: state.updatedProjects?.filter(
          (project: Project) => project.projectName !== projectName,
        ),
      };
    }

    case actionTypes.CREATE_DIFF: {
      const projectName = action.payload;
      const selectedProject = state.updatedProjects?.find(
        (project: Project) => project.projectName === projectName,
      );
      const selectedProjectUpdatedVars = getProjectUpdatedVars(selectedProject);

      const originalVars: any[] =
        state.originalProjects
          ?.filter((originalProject: Project) => originalProject.projectName === projectName)
          .flatMap((originalProject: Project) =>
            originalProject.hosts.flatMap((host: Host) =>
              host.hostDetailsByInventoryType.flatMap((hostDetailByInventoryType: HostDetails) =>
                hostDetailByInventoryType.variables.filter((variable: HostVariable) =>
                  selectedProjectUpdatedVars.some(
                    (updatedVar) => updatedVar.pathInProject === variable.pathInProject,
                  ),
                ),
              ),
            ),
          ) || [];

      return {
        ...state,
        updatedVars: selectedProjectUpdatedVars,
        originalVars,
        originalDiff: originalVars[0],
        updatedDiff: selectedProjectUpdatedVars[0],
      };
    }
    case actionTypes.CLEAR_PROJECT_UPDATES: {
      const projectName = action.payload;
      return {
        ...state,
        originalDiff: null,
        updatedDiff: null,
        updatedVars: [],
        updatedProjects: state.updatedProjects?.filter(
          (updatedProject) => updatedProject.projectName !== projectName,
        ),
      };
    }
    case actionTypes.CLEAR_ALL_PROJECTS_UPDATES: {
      return {
        ...state,
        originalDiff: null,
        updatedDiff: null,
        updatedVars: [],
        updatedProjects: [],
      };
    }
    case actionTypes.INITIALIZE_EDITOR: {
      const { hostDetailsByInventoryType, projectName, hostname } = action.payload;

      let updatedOriginalProjects: Project[];
      const originalProject = state.originalProjects?.find(
        (originalProject: Project) => originalProject.projectName === projectName,
      );
      const hostPresentInOriginalProject = !!originalProject?.hosts.find(
        (host: Host) => host.hostname === hostname,
      );

      if (!originalProject) {
        updatedOriginalProjects = [
          ...(state.originalProjects || []),
          { projectName, hosts: [{ hostname, hostDetailsByInventoryType }] },
        ];
        // if the project is present, but host is not inside the project, add the host there. common vars or group vars could be updated via another host, that's why we need to map hostDetailsByInventoryType to search for already updated variables
      } else if (originalProject && !hostPresentInOriginalProject) {
        updatedOriginalProjects = state.originalProjects.map((originalProject: Project) => {
          if (originalProject.projectName === projectName) {
            return {
              ...originalProject,
              hosts: [...originalProject.hosts, { hostname, hostDetailsByInventoryType }],
            };
          } else {
            return originalProject;
          }
        });
      } else {
        updatedOriginalProjects = state.originalProjects;
      }

      let selectedHostDetails, selectedVariables, selectedHostDetailsByInventoryType;

      // try to find existing selectedHostDetails in updated code
      selectedHostDetailsByInventoryType = findHostDetailsByInventoryType(
        projectName,
        hostname,
        state?.updatedProjects,
      );

      // if its in updated code, make it selected and exit. Is it in original code, tho?
      if (selectedHostDetailsByInventoryType) {
        selectedHostDetails = selectedHostDetailsByInventoryType[0];
        selectedVariables = selectedHostDetails.variables[0];
        return {
          ...state,
          originalProjects: updatedOriginalProjects,
          selectedHostDetailsByInventoryType,
          selectedHostDetails,
          selectedVariables,
        };
      } else {
        // check, jestli to není updatované přes něco jiného
        const updatedVars = getAllUpdatedVars(state.updatedProjects);
        let incomingHostDetailsByInventoryTypeVariablesWereUpdated;

        const updatedHostDetailsByInventoryType = hostDetailsByInventoryType.map(
          (hostDetailByInventoryType: HostDetails) => {
            return {
              ...hostDetailByInventoryType,
              variables: hostDetailByInventoryType.variables.map((variable: HostVariable) => {
                const updatedVar = updatedVars.find((updatedVar) => {
                  return updatedVar.pathInProject === variable.pathInProject;
                });
                if (updatedVar) {
                  incomingHostDetailsByInventoryTypeVariablesWereUpdated = true;
                  return updatedVar;
                } else {
                  return variable;
                }
              }),
            };
          },
        );

        if (incomingHostDetailsByInventoryTypeVariablesWereUpdated) {
          // je to updatované přes něco jiného, a zároveň to není v updatedProjects
          const updatedHostDetailsByInventoryTypeAll = updatedHostDetailsByInventoryType.map(
            (updatedHostDetailByInventoryType: HostDetails) => {
              return {
                ...updatedHostDetailByInventoryType,
                variables: updatedHostDetailByInventoryType.variables.map(
                  (variable: HostVariable) => {
                    if (variable.type === 'applied') {
                      const commonVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable: HostVariable) => variable.type === 'common',
                      );
                      const groupVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable: HostVariable) => variable.type === 'group',
                      );
                      const hostVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable: HostVariable) => variable.type === 'host',
                      );
                      return processVariables(
                        variable,
                        commonVariables,
                        groupVariables,
                        hostVariables,
                      );
                    } else {
                      return variable;
                    }
                  },
                ),
              };
            },
          );

          const updatedProject = state.updatedProjects.find(
            (updatedProject: Project) => updatedProject.projectName === projectName,
          );
          const hostPresentInUpdatedProject = !!updatedProject?.hosts.find(
            (host: Host) => host.hostname === hostname,
          );

          selectedHostDetailsByInventoryType = updatedHostDetailsByInventoryTypeAll;
          selectedHostDetails = updatedHostDetailsByInventoryTypeAll[0];
          selectedVariables = updatedHostDetailsByInventoryTypeAll[0].variables[0];

          let updatedUpdatedProjects: Project[] = [];
          if (!updatedProject) {
            updatedUpdatedProjects = [
              ...state.updatedProjects,
              {
                projectName,
                hosts: [
                  { hostname, hostDetailsByInventoryType: updatedHostDetailsByInventoryTypeAll },
                ],
              },
            ];
          } else if (updatedProject && !hostPresentInUpdatedProject) {
            updatedUpdatedProjects = state.updatedProjects.map((updatedProject: Project) => {
              if (updatedProject.projectName === projectName) {
                return {
                  ...updatedProject,
                  hosts: [
                    ...updatedProject.hosts,
                    {
                      hostname,
                      hostDetailsByInventoryType: updatedHostDetailsByInventoryTypeAll,
                    },
                  ],
                };
              } else {
                return updatedProject;
              }
            });
          } else {
            updatedUpdatedProjects = state.updatedProjects;
          }

          return {
            ...state,
            selectedHostDetailsByInventoryType,
            originalProjects: updatedOriginalProjects,
            updatedProjects: updatedUpdatedProjects,
            selectedHostDetails,
            selectedVariables,
          };
        } else {
          // není to updatované přes nic jiného
          return {
            ...state,
            originalProjects: updatedOriginalProjects,
            selectedHostDetailsByInventoryType: hostDetailsByInventoryType,
            selectedHostDetails: hostDetailsByInventoryType[0],
            selectedVariables: hostDetailsByInventoryType[0].variables[0],
          };
        }
      }
    }
    case actionTypes.SHOW_DIFF: {
      const { originalVars, updatedVars } = state;
      const newSelectedDiffPath = action.payload;
      const originalDiff = originalVars?.find(
        (variable: HostVariable) => variable.pathInProject === newSelectedDiffPath,
      );
      const updatedDiff = updatedVars?.find(
        (variable: HostVariable) => variable.pathInProject === newSelectedDiffPath,
      );
      return {
        ...state,
        originalDiff,
        updatedDiff,
      };
    }
    case actionTypes.ROLLBACK: {
      const { pathInProject } = action.payload;

      const updatedOriginalVars = state.originalVars?.filter(
        (variable: HostVariable) => variable.pathInProject !== pathInProject,
      );
      const updatedUpdatedVars = state.updatedVars?.filter(
        (variable: HostVariable) => variable.pathInProject !== pathInProject,
      );

      const originalVar = state.originalVars!.find(
        (variable: HostVariable) => variable.pathInProject === pathInProject,
      )!;
      const updatedProjects = replaceVariableInProjectsArray(originalVar, state.updatedProjects)!;
      return {
        ...state,
        originalVars: updatedOriginalVars,
        updatedVars: updatedUpdatedVars,
        originalDiff: updatedOriginalVars?.[0],
        updatedDiff: updatedUpdatedVars?.[0],
        updatedProjects,
      };
    }
    case actionTypes.UPDATE_VARIABLES: {
      const { newEditorValue, projectName, hostname } = action.payload;
      const error = tryToParseYml(newEditorValue);

      let updatedSelectedVariables = omit(['updated'], {
        ...state.selectedVariables,
        error,
        values: newEditorValue,
      });
      // try to find the new selectedVariables inside original project to see if the variable was updated (for git)
      const originalSelectedVariables: Partial<HostVariable> | undefined = omit(
        ['updated'],
        findVariableObject(
          state.originalProjects,
          state.selectedVariables.pathInProject,
          projectName,
          hostname,
        ),
      );

      updatedSelectedVariables = {
        ...updatedSelectedVariables,
        updated:
          JSON.stringify(updatedSelectedVariables) !== JSON.stringify(originalSelectedVariables),
      };

      // update variables chosen in editor
      let updatedVariablesSelectedOnly = state.selectedHostDetails?.variables.map(
        (variable: HostVariable) => {
          if (variable.pathInProject === state.selectedVariables.pathInProject) {
            return updatedSelectedVariables;
          } else {
            return variable;
          }
        },
      );

      // updated variables all - meaning including applied variables
      let updatedAppliedVariablesAreNotSameAsOriginalUpdatedVariables;

      const updatedVariablesAll = error
        ? updatedVariablesSelectedOnly
        : updatedVariablesSelectedOnly?.map((variable: Omit<any, 'updated'> | HostVariable) => {
            if (variable.type === 'applied') {
              const commonVariables = updatedVariablesSelectedOnly?.find(
                (variable) => variable.type === 'common',
              );
              const groupVariables = updatedVariablesSelectedOnly?.find(
                (variable) => variable.type === 'group',
              );
              const hostVariables = updatedVariablesSelectedOnly?.find(
                (variable) => variable.type === 'host',
              );

              return processVariables(variable, commonVariables, groupVariables, hostVariables);
            } else {
              return variable;
            }
          });

      // @ts-ignore
      const updatedSelectedHostDetailsByInventoryType: HostDetails[] =
        state.selectedHostDetailsByInventoryType?.map((hostDetail: HostDetails) => {
          if (hostDetail.inventoryType === state.selectedHostDetails?.inventoryType) {
            return {
              ...hostDetail,
              variables: updatedVariablesAll,
            };
          } else {
            return hostDetail;
          }
        });

      const updatedSelectedHostDetails: HostDetails = {
        ...state.selectedHostDetails,
        // @ts-ignore
        variables: updatedVariablesAll,
      };

      const updatedProjectInState = state.updatedProjects?.find(
        (project: Project) => project.projectName === projectName,
      );
      const updatedProjectExistsInState = !!updatedProjectInState;

      const hostExistInUpdatedProject = updatedProjectInState?.hosts.find(
        (host: Host) => host.hostname === hostname,
      );

      let updatedProjects: Project[] = state.updatedProjects;
      if (updatedProjectExistsInState && hostExistInUpdatedProject) {
        // @ts-ignore
        updatedProjects = state.updatedProjects.map((project: Project) => {
          if (project.projectName === projectName) {
            return {
              projectName,
              hosts: project.hosts.map((host: Host) => {
                return {
                  ...host,
                  hostDetailsByInventoryType: host.hostDetailsByInventoryType.map(
                    (hostDetailByInventoryType: HostDetails) => {
                      return {
                        ...hostDetailByInventoryType,
                        variables: hostDetailByInventoryType.variables.map(
                          (variable: HostVariable) => {
                            if (variable.pathInProject === updatedSelectedVariables.pathInProject) {
                              return updatedSelectedVariables;
                            } else if (variable.type === 'applied') {
                              const updatedVariableIsInCurrentHostDetailByInventoryType =
                                !!hostDetailByInventoryType.variables.find(
                                  (variable: HostVariable) =>
                                    variable.pathInProject ===
                                    updatedSelectedVariables.pathInProject,
                                );

                              const commonVariables =
                                updatedVariableIsInCurrentHostDetailByInventoryType &&
                                updatedSelectedVariables.type === 'common'
                                  ? updatedSelectedVariables
                                  : hostDetailByInventoryType.variables?.find(
                                      (variable: HostVariable) => variable.type === 'common',
                                    );

                              const groupVariables =
                                updatedVariableIsInCurrentHostDetailByInventoryType &&
                                updatedSelectedVariables.type === 'group'
                                  ? updatedSelectedVariables
                                  : hostDetailByInventoryType.variables?.find(
                                      (variable: HostVariable) => variable.type === 'group',
                                    );
                              const hostVariables = hostDetailByInventoryType.variables?.find(
                                (variable: HostVariable) => variable.type === 'host',
                              );

                              try {
                                const appliedVariables = {
                                  ...(commonVariables && parseYaml(commonVariables.values)),
                                  ...(groupVariables && parseYaml(groupVariables.values)),
                                  ...(hostVariables && parseYaml(hostVariables.values)),
                                };

                                if ('0' in appliedVariables) {
                                  updatedVariablesSelectedOnly =
                                    state.selectedHostDetails?.variables.map(
                                      (variable: HostVariable) => {
                                        if (
                                          variable.pathInProject ===
                                            state.selectedVariables.pathInProject &&
                                          variable.type !== 'applied'
                                        ) {
                                          return {
                                            ...updatedSelectedVariables,
                                            error: 'Unfinished key',
                                          };
                                        } else {
                                          return variable;
                                        }
                                      },
                                    );
                                  updatedSelectedVariables = {
                                    ...updatedSelectedVariables,
                                    ...(updatedSelectedVariables.type !== 'applied' && {
                                      error: 'Unfinished key',
                                    }),
                                  };
                                  throw new Error();
                                }

                                const stringifiedAppliedVariables = stringify(appliedVariables);
                                const appliedVariablesToShow =
                                  stringifiedAppliedVariables === '{}\n'
                                    ? ''
                                    : stringifiedAppliedVariables;

                                return {
                                  ...variable,
                                  values: appliedVariablesToShow,
                                };
                              } catch (e) {
                                return variable;
                              }
                            } else {
                              return variable;
                            }
                          },
                        ),
                      };
                    },
                  ),
                };
              }),
            };
          } else {
            return project;
          }
        });
      } else if (updatedProjectInState && !hostExistInUpdatedProject) {
        updatedProjects = state.updatedProjects.map((project) => {
          if (project.projectName === projectName) {
            return {
              projectName,
              // add a host with updated hostDetailsByInventoryType
              hosts: [
                ...project.hosts,
                { hostname, hostDetailsByInventoryType: updatedSelectedHostDetailsByInventoryType },
              ],
            };
          } else {
            return project;
          }
        });
      } else {
        updatedProjects = [
          ...(state.updatedProjects || []),
          {
            projectName,
            hosts: [
              { hostname, hostDetailsByInventoryType: updatedSelectedHostDetailsByInventoryType },
            ],
          },
        ];
      }
      return {
        ...state,
        selectedVariables: updatedSelectedVariables,
        selectedHostDetails: updatedSelectedHostDetails,
        selectedHostDetailsByInventoryType: updatedSelectedHostDetailsByInventoryType,
        updatedProjects: updatedAppliedVariablesAreNotSameAsOriginalUpdatedVariables
          ? updatedProjects
          : updatedProjects.filter((project: Project) => projectHasUpdatedVariables(project)),
      };
    }
    default:
      return state;
  }
};

export const createDiff = (payload: any): ReducerAction => ({
  type: actionTypes.CREATE_DIFF,
  payload,
});

export const rollback = (payload: any): ReducerAction => ({
  type: actionTypes.ROLLBACK,
  payload,
});

export const clearProjectUpdates = (payload: any): ReducerAction => ({
  type: actionTypes.CLEAR_PROJECT_UPDATES,
  payload,
});
export const switchMode = (): ReducerAction => ({ type: actionTypes.SWITCH_MODE });

export const updateVariables = (payload: any): ReducerAction => ({
  type: actionTypes.UPDATE_VARIABLES,
  payload,
});

export const showHostDetails = (payload: any): ReducerAction => ({
  type: actionTypes.SHOW_HOST_DETAILS,
  payload,
});

export const showDiff = (payload: any): ReducerAction => ({
  type: actionTypes.SHOW_DIFF,
  payload,
});

export const showVariables = (payload: any): ReducerAction => ({
  type: actionTypes.SHOW_VARIABLES,
  payload,
});

export const initializeEditor = (payload: any): ReducerAction => ({
  type: actionTypes.INITIALIZE_EDITOR,
  payload,
});
export const initializeContext = (payload: any): ReducerAction => ({
  type: actionTypes.INITIALIZE_CONTEXT,
  payload,
});
export const selectProject = (payload: any): ReducerAction => ({
  type: actionTypes.SELECT_PROJECT,
  payload,
});

export const clearProjectUpdatesFromEditor = (payload: any): ReducerAction => ({
  type: actionTypes.CLEAR_PROJECT_UPDATES_FROM_EDITOR,
  payload,
});

export const clearAllProjectsUpdates = (): ReducerAction => ({
  type: actionTypes.CLEAR_ALL_PROJECTS_UPDATES,
});

export const clearAllProjectUpdatesFromEditor = (payload: any): ReducerAction => ({
  type: actionTypes.CLEAR_ALL_PROJECT_UPDATES_FROM_EDITOR,
  payload,
});

export const deleteProject = (payload: any): ReducerAction => ({
  type: actionTypes.DELETE_PROJECT,
  payload,
});

export const edit = (payload: any): ReducerAction => ({
  type: actionTypes.EDIT,
  payload,
});

export const enableEditorInitialize = (): ReducerAction => ({
  type: actionTypes.ENABLE_EDITOR_INITIALIZE,
});

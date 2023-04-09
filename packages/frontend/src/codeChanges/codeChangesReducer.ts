import keyMirror from 'keymirror';
import { parse as parseYaml, stringify } from 'yaml';
import { omit } from 'ramda';

interface HostVariable {
  type: string;
  pathInProject: string;
  values: string;
  updated: boolean;
}

export interface HostDetails {
  inventoryType: string;
  groupName: string;
  variables: HostVariable[];
}

interface Host {
  hostname: string;
  hostDetailsByInventoryType: HostDetails[];
}

function findVariableObject(
  projects: Project[],
  path: string,
  projectName: string,
  hostname: string,
): HostVariable | undefined {
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
}

const findHostDetailsByInventoryType = (
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

function findAppliedVariableObject(
  projects: Project[],
  projectName: string,
  hostname: string,
  inventoryType: string | undefined,
): HostVariable | undefined {
  const project = projects.find((p: Project) => p.projectName === projectName);

  if (!project) {
    return undefined;
  }

  const host = project.hosts.find((h: Host) => h.hostname === hostname);

  if (!host) {
    return undefined;
  }
  const inventory = host.hostDetailsByInventoryType.find(
    (hostDetail: HostDetails) => hostDetail.inventoryType === inventoryType,
  );
  if (!inventory) {
    return undefined;
  }

  for (const variable of inventory.variables) {
    if (variable.type === 'applied') {
      return variable;
    }
  }

  return undefined;
}

interface Project {
  projectName: string;
  hosts: Host[];
}

function replaceVariableInProjectsArray(
  newVariable: HostVariable,
  projects: Project[],
): Project[] | undefined {
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
            updatedVariablesAll = updatedVariables.map((variable) => {
              if (variable.type === 'applied') {
                const commonVariables = updatedVariables.find(
                  (variable) => variable.type === 'common',
                );
                const groupVariables = updatedVariables.find(
                  (variable) => variable.type === 'group',
                );
                const hostVariables = updatedVariables.find((variable) => variable.type === 'host');

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
}

interface CodeChangesState {
  selectedProjectName: string | null;
  isInEditMode: boolean;
  selectedHostDetailsByInventoryType: HostDetails[] | null;
  selectedHostDetails?: HostDetails | null;
  selectedVariables: any;
  originalVars: HostVariable[] | null;
  updatedVars: HostVariable[] | null;
  updatedProjects: Project[];
  originalProjects: Project[];
  originalDiff: HostVariable | null;
  updatedDiff: HostVariable | null;
}
interface CodeChangesAction {
  type: string;
  payload?: any;
}
export const actionTypes = keyMirror({
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
  CLEAR_ALL_UPDATES: null,
  OPEN_COMMIT_MODAL: null,
  CLOSE_COMMIT_MODAL: null,
  CLEAR_PROJECT_UPDATES: null,
  CLEAR_PROJECT_UPDATES_INCLUDING_GIT: null,
  CLEAR_PROJECT_UPDATES_FROM_EDITOR: null,
});
export const initialState: CodeChangesState = {
  updatedProjects: [],
  originalProjects: [],
  isInEditMode: false,
  selectedHostDetails: null,
  selectedVariables: null,
  selectedHostDetailsByInventoryType: [],
  originalDiff: null,
  updatedDiff: null,
  originalVars: [],
  updatedVars: [],
  selectedProjectName: null,
};

const getProjectUpdatedVars = (project: any): any[] => {
  const updatedVars: any[] = [];
  project?.hosts?.forEach((host: Host) => {
    host.hostDetailsByInventoryType.forEach((hostDetailByInventoryType: HostDetails) => {
      hostDetailByInventoryType.variables.forEach((variable: HostVariable) => {
        if (variable.updated && variable.type !== 'applied') {
          updatedVars.push(variable);
        }
      });
    });
  });
  return updatedVars;
};
function getAllUpdatedVars(updatedProjects: Project[]) {
  const updatedVars: any[] = [];
  updatedProjects?.forEach((updatedProject: Project) => {
    updatedVars.push(...getProjectUpdatedVars(updatedProject));
  });
  return updatedVars;
}

export const codeChangesReducer = (
  state = initialState,
  action: CodeChangesAction,
): CodeChangesState => {
  switch (action.type) {
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
    case actionTypes.CLEAR_PROJECT_UPDATES_FROM_EDITOR: {
      const { projectName, hostname } = action.payload;
      const originalSelectedHostDetailsByInventoryType = state.originalProjects
        .find((project) => project.projectName === projectName)
        ?.hosts.find((host) => host.hostname === hostname)?.hostDetailsByInventoryType;
      const originalSelectedHostDetail = originalSelectedHostDetailsByInventoryType?.find(
        (selectedHostDetail) =>
          selectedHostDetail.inventoryType === state.selectedHostDetails?.inventoryType,
      );
      const originalSelectedVariables = originalSelectedHostDetail?.variables.find(
        (variable) => variable.type === state.selectedVariables.type,
      );
      return {
        ...state,
        selectedHostDetailsByInventoryType: originalSelectedHostDetailsByInventoryType,
        selectedHostDetails: originalSelectedHostDetail,
        selectedVariables: originalSelectedVariables,
        updatedProjects: state.updatedProjects.filter(
          (project) => project.projectName !== projectName,
        ),
      };
    }
    case actionTypes.CLEAR_PROJECT_UPDATES_INCLUDING_GIT: {
      return {
        ...state,
        originalDiff: undefined,
        updatedDiff: undefined,
        originalVars: [],
        updatedVars: [],
        updatedProjects: state.updatedProjects.filter(
          (project) => project.projectName !== action.payload,
        ),
      };
    }
    case actionTypes.CLEAR_PROJECT_UPDATES:
      return {
        ...state,
        updatedProjects: state.updatedProjects.filter(
          (project) => project.projectName != action.payload,
        ),
      };
    case actionTypes.CREATE_DIFF: {
      const projectName = action.payload;
      const selectedProject = state.updatedProjects.find(
        (project) => project.projectName === projectName,
      );
      const selectedProjectUpdatedVars = getProjectUpdatedVars(selectedProject);

      const originalVars: any[] = [];
      state.originalProjects?.forEach((originalProject: Project) => {
        if (originalProject.projectName === projectName) {
          originalProject.hosts.forEach((host: Host) => {
            host.hostDetailsByInventoryType.forEach((hostDetailByInventoryType: HostDetails) => {
              hostDetailByInventoryType.variables.forEach((variable: HostVariable) => {
                if (
                  selectedProjectUpdatedVars.some(
                    (updatedVar) => updatedVar.pathInProject === variable.pathInProject,
                  )
                ) {
                  originalVars.push(variable);
                }
              });
            });
          });
        }
      });

      return {
        ...state,
        updatedVars: selectedProjectUpdatedVars,
        originalVars,
        originalDiff: originalVars[0],
        updatedDiff: selectedProjectUpdatedVars[0],
      };
    }
    case actionTypes.CLEAR_ALL_UPDATES: {
      return {
        ...state,
        originalDiff: null,
        updatedDiff: null,
        originalVars: state.originalVars?.filter(
          (originalVar) => originalVar.pathInProject.split('\\')[1] !== state.selectedProjectName,
        ),
        updatedVars: state.updatedVars?.filter(
          (updatedVar) => updatedVar.pathInProject.split('\\')[1] !== state.selectedProjectName,
        ),
        updatedProjects: state.updatedProjects?.filter(
          (updatedProject) => updatedProject.projectName !== state.selectedProjectName,
        ),
      };
    }
    case actionTypes.INITIALIZE_EDITOR: {
      const { hostDetailsByInventoryType, projectName, hostname } = action.payload;

      let selectedHostDetails, selectedVariables, selectedHostDetailsByInventoryType;

      // try to find existing selectedHostDetails in updated code
      selectedHostDetailsByInventoryType = findHostDetailsByInventoryType(
        projectName,
        hostname,
        state.updatedProjects,
      );

      // if not present, try to find it in original code
      if (!selectedHostDetailsByInventoryType) {
        selectedHostDetailsByInventoryType = findHostDetailsByInventoryType(
          projectName,
          hostname,
          state.originalProjects,
        );
      }

      // if it is present either in original or updated code, make it selected and exit this function
      if (selectedHostDetailsByInventoryType) {
        selectedHostDetails = selectedHostDetailsByInventoryType[0];
        selectedVariables = selectedHostDetails.variables[0];
        return {
          ...state,
          selectedHostDetailsByInventoryType,
          selectedHostDetails,
          selectedVariables,
        };
      } else {
        // if hostDetailsByInventoryType not present at all, make it selected for the page
        selectedHostDetailsByInventoryType = hostDetailsByInventoryType;
        selectedHostDetails = hostDetailsByInventoryType[0];
        selectedVariables = selectedHostDetails.variables[0];

        const originalProject = state.originalProjects?.find(
          (originalProject: Project) => originalProject.projectName === projectName,
        );
        const hostPresentInOriginalProject = !!originalProject?.hosts.find(
          (host: Host) => host.hostname === hostname,
        );

        let updatedOriginalProjects: Project[] = [];
        let updatedUpdatedProjects: Project[] = [];
        // if the project is not there at all, add it
        if (!originalProject) {
          updatedOriginalProjects = [
            ...state.originalProjects,
            { projectName, hosts: [{ hostname, hostDetailsByInventoryType }] },
          ];
          updatedUpdatedProjects = state.updatedProjects;
          // if the project is present, but host is not inside the project, add the host there. common vars or group vars could be updated via another host, thats why we need to map hostDetailsByInventoryType to search for already updated variables
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

          const updatedVars = getAllUpdatedVars(state.updatedProjects);

          let incomingHostDetailsByInventoryTypeVariablesWereUpdated;

          const updatedHostDetailsByInventoryType = hostDetailsByInventoryType.map(
            (hostDetailByInventoryType) => {
              return {
                ...hostDetailByInventoryType,
                variables: hostDetailByInventoryType.variables.map((variable) => {
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

          let updatedHostDetailsByInventoryTypeAll = updatedHostDetailsByInventoryType;
          if (incomingHostDetailsByInventoryTypeVariablesWereUpdated) {
            updatedHostDetailsByInventoryTypeAll = updatedHostDetailsByInventoryType.map(
              (updatedHostDetailByInventoryType) => {
                return {
                  ...updatedHostDetailByInventoryType,
                  variables: updatedHostDetailByInventoryType.variables.map((variable) => {
                    if (variable.type === 'applied') {
                      const commonVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable) => variable.type === 'common',
                      );
                      const groupVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable) => variable.type === 'group',
                      );
                      const hostVariables = updatedHostDetailByInventoryType.variables.find(
                        (variable) => variable.type === 'host',
                      );

                      try {
                        const appliedVariables = {
                          ...(commonVariables && parseYaml(commonVariables.values)),
                          ...(groupVariables && parseYaml(groupVariables.values)),
                          ...(hostVariables && parseYaml(hostVariables.values)),
                        };

                        // prevent monaco editor showing {}
                        const stringifiedAppliedVariables = stringify(appliedVariables);
                        const appliedVariablesToShow =
                          stringifiedAppliedVariables === '{}\n' ? '' : stringifiedAppliedVariables;

                        const updatedAppliedVariables = omit(['updated'], {
                          ...variable,
                          values: appliedVariablesToShow,
                        });

                        const originalAppliedVariables = findAppliedVariableObject(
                          state.originalProjects,
                          projectName,
                          hostname,
                          state.selectedHostDetails?.inventoryType,
                        );

                        return {
                          ...updatedAppliedVariables,
                          updated:
                            JSON.stringify(updatedAppliedVariables) !==
                            JSON.stringify(originalAppliedVariables),
                        };
                      } catch (e) {
                        return variable;
                      }
                    } else {
                      return variable;
                    }
                  }),
                };
              },
            );

            const updatedProject = state.updatedProjects.find(
              (updatedProject) => updatedProject.projectName === projectName,
            );
            const hostPresentInUpdatedProject = !!updatedProject?.hosts.find(
              (host: Host) => host.hostname === hostname,
            );

            if (!updatedProject) {
              updatedUpdatedProjects = [
                ...state.originalProjects,
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
          } else {
            updatedUpdatedProjects = state.updatedProjects;
          }
        } else {
          updatedOriginalProjects = state.originalProjects;
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

      const originalVar = state.originalVars?.find(
        (variable: HostVariable) => variable.pathInProject === pathInProject,
      );

      const updatedProjects = replaceVariableInProjectsArray(originalVar, state.updatedProjects);
      return {
        ...state,
        originalVars: updatedOriginalVars,
        updatedVars: updatedUpdatedVars,
        originalDiff: updatedOriginalVars[0],
        updatedDiff: updatedUpdatedVars[0],
        updatedProjects,
      };
    }
    case actionTypes.UPDATE_VARIABLES: {
      const { newEditorValue, projectName, hostname } = action.payload;
      let error: any;
      try {
        parseYaml(newEditorValue);
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e.message;
        } else {
          error = String(e);
        }
      }

      let updatedSelectedVariables = omit(['updated'], {
        ...state.selectedVariables,
        error,
        values: newEditorValue,
      });
      // try to find the new selectedVariables inside original project to see if the variable was updated (for git)
      const originalSelectedVariables: HostVariable | undefined = omit(
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
      const updatedVariablesAll = error
        ? updatedVariablesSelectedOnly
        : updatedVariablesSelectedOnly?.map((variable) => {
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

              try {
                const appliedVariables = {
                  ...(commonVariables && parseYaml(commonVariables.values)),
                  ...(groupVariables && parseYaml(groupVariables.values)),
                  ...(hostVariables && parseYaml(hostVariables.values)),
                };

                if ('0' in appliedVariables) {
                  updatedVariablesSelectedOnly = state.selectedHostDetails?.variables.map(
                    (variable: HostVariable) => {
                      if (
                        variable.pathInProject === state.selectedVariables.pathInProject &&
                        variable.type !== 'applied'
                      ) {
                        return { ...updatedSelectedVariables, error: 'Unfinished key' };
                      } else {
                        return variable;
                      }
                    },
                  );
                  updatedSelectedVariables = {
                    ...updatedSelectedVariables,
                    ...(updatedSelectedVariables.type !== 'applied' && { error: 'Unfinished key' }),
                  };

                  throw new Error();
                }
                // prevent monaco editor showing {}
                const stringifiedAppliedVariables = stringify(appliedVariables);
                const appliedVariablesToShow =
                  stringifiedAppliedVariables === '{}\n' ? '' : stringifiedAppliedVariables;

                const updatedAppliedVariables = omit(['updated'], {
                  ...variable,
                  values: appliedVariablesToShow,
                });

                const originalAppliedVariables = findAppliedVariableObject(
                  state.originalProjects,
                  projectName,
                  hostname,
                  state.selectedHostDetails?.inventoryType,
                );
                return {
                  ...updatedAppliedVariables,
                  updated:
                    JSON.stringify(updatedAppliedVariables) !==
                    JSON.stringify(originalAppliedVariables),
                };
              } catch (e) {
                return variable;
              }
            } else {
              return variable;
            }
          });

      const updatedSelectedHostDetailsByInventoryType =
        state.selectedHostDetailsByInventoryType?.map((hostDetail) => {
          if (hostDetail.inventoryType === state.selectedHostDetails?.inventoryType) {
            return {
              ...hostDetail,
              variables: updatedVariablesAll,
            };
          } else {
            return hostDetail;
          }
        });

      const updatedSelectedHostDetails = {
        ...state.selectedHostDetails,
        variables: updatedVariablesAll,
      };

      const updatedProjectInState = state.updatedProjects?.find(
        (project) => project.projectName === projectName,
      );
      const updatedProjectExistsInState = !!updatedProjectInState;

      const hostExistInUpdatedProject = updatedProjectInState?.hosts.find(
        (host) => host.hostname === hostname,
      );

      let updatedProjects;
      if (updatedProjectExistsInState && hostExistInUpdatedProject) {
        updatedProjects = state.updatedProjects.map((project) => {
          if (project.projectName === projectName) {
            return {
              projectName,
              hosts: project.hosts.map((host) => {
                return {
                  ...host,
                  hostDetailsByInventoryType: host.hostDetailsByInventoryType.map(
                    (hostDetailByInventoryType) => {
                      return {
                        ...hostDetailByInventoryType,
                        variables: hostDetailByInventoryType.variables.map((variable) => {
                          if (variable.pathInProject === updatedSelectedVariables.pathInProject) {
                            return updatedSelectedVariables;
                          } else if (variable.type === 'applied') {
                            const updatedVariableIsInCurrentHostDetailByInventoryType =
                              !!hostDetailByInventoryType.variables.find(
                                (variable) =>
                                  variable.pathInProject === updatedSelectedVariables.pathInProject,
                              );

                            const commonVariables =
                              updatedVariableIsInCurrentHostDetailByInventoryType &&
                              updatedSelectedVariables.type === 'common'
                                ? updatedSelectedVariables
                                : hostDetailByInventoryType.variables?.find(
                                    (variable) => variable.type === 'common',
                                  );

                            const groupVariables =
                              updatedVariableIsInCurrentHostDetailByInventoryType &&
                              updatedSelectedVariables.type === 'group'
                                ? updatedSelectedVariables
                                : hostDetailByInventoryType.variables?.find(
                                    (variable) => variable.type === 'group',
                                  );
                            const hostVariables = hostDetailByInventoryType.variables?.find(
                              (variable) => variable.type === 'host',
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

                              // prevent monaco editor showing {}
                              const stringifiedAppliedVariables = stringify(appliedVariables);
                              const appliedVariablesToShow =
                                stringifiedAppliedVariables === '{}\n'
                                  ? ''
                                  : stringifiedAppliedVariables;

                              const updatedAppliedVariables = omit(['updated'], {
                                ...variable,
                                values: appliedVariablesToShow,
                              });

                              const originalAppliedVariables = findAppliedVariableObject(
                                state.originalProjects,
                                projectName,
                                hostname,
                                state.selectedHostDetails?.inventoryType,
                              );
                              return {
                                ...updatedAppliedVariables,
                                updated:
                                  JSON.stringify(updatedAppliedVariables) !==
                                  JSON.stringify(originalAppliedVariables),
                              };
                            } catch (e) {
                              return variable;
                            }
                          } else {
                            return variable;
                          }
                        }),
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
          ...state.updatedProjects,
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
        updatedProjects,
      };
    }
    default:
      return state;
  }
};

export const createDiff = (payload: any): CodeChangesAction => ({
  type: actionTypes.CREATE_DIFF,
  payload,
});

export const rollback = (payload: any): CodeChangesAction => ({
  type: actionTypes.ROLLBACK,
  payload,
});

export const clearAllUpdates = (): CodeChangesAction => ({ type: actionTypes.CLEAR_ALL_UPDATES });
export const switchMode = (): CodeChangesAction => ({ type: actionTypes.SWITCH_MODE });

export const updateVariables = (payload: any): CodeChangesAction => ({
  type: actionTypes.UPDATE_VARIABLES,
  payload,
});

export const showHostDetails = (payload: any): CodeChangesAction => ({
  type: actionTypes.SHOW_HOST_DETAILS,
  payload,
});

export const showDiff = (payload: any): CodeChangesAction => ({
  type: actionTypes.SHOW_DIFF,
  payload,
});

export const showVariables = (payload: any): CodeChangesAction => ({
  type: actionTypes.SHOW_VARIABLES,
  payload,
});

export const initializeEditor = (payload: any): CodeChangesAction => ({
  type: actionTypes.INITIALIZE_EDITOR,
  payload,
});
export const initializeContext = (payload: any): CodeChangesAction => ({
  type: actionTypes.INITIALIZE_CONTEXT,
  payload,
});
export const selectProject = (payload: any): CodeChangesAction => ({
  type: actionTypes.SELECT_PROJECT,
  payload,
});

export const clearProjectUpdates = (payload: any): CodeChangesAction => ({
  type: actionTypes.CLEAR_PROJECT_UPDATES,
  payload,
});

export const clearProjectUpdatesIncludingGit = (payload: any): CodeChangesAction => ({
  type: actionTypes.CLEAR_PROJECT_UPDATES_INCLUDING_GIT,
  payload,
});

export const clearProjectUpdatesFromEditor = (payload: any): CodeChangesAction => ({
  type: actionTypes.CLEAR_PROJECT_UPDATES_FROM_EDITOR,
  payload,
});

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
  for (let i = 0; i < updatedProjects.length; i++) {
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

function hasErrorKey(hostDetailsByInventoryType) {
  for (const hostDetails of hostDetailsByInventoryType) {
    for (const variable of hostDetails.variables) {
      if (variable.error !== undefined) {
        return true;
      }
    }
  }
  return false;
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
        (hostDetails: HostDetails) => ({
          ...hostDetails,
          variables: hostDetails.variables.map((variable: HostVariable) =>
            variable.pathInProject === newVariable.pathInProject ? newVariable : variable,
          ),
        }),
      ),
    })),
  }));
}

interface CodeChangesState {
  isInEditMode: boolean;
  selectedHostDetailsByInventoryType: HostDetails[] | undefined;
  selectedHostDetails?: HostDetails | undefined;
  selectedVariables: any;
  originalVars: HostVariable[] | undefined;
  updatedVars: HostVariable[] | undefined;
  updatedProjects: Project[];
  originalProjects: Project[];
  originalDiff: HostVariable | undefined;
  updatedDiff: HostVariable | undefined;
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
});
export const initialState: CodeChangesState = {
  updatedProjects: [],
  originalProjects: [],
  isInEditMode: false,
  selectedHostDetails: undefined,
  selectedVariables: undefined,
  selectedHostDetailsByInventoryType: [],
  originalDiff: undefined,
  updatedDiff: undefined,
  originalVars: [],
  updatedVars: [],
};

function getUpdatedVars(updatedProjects: Project[]) {
  const updatedVars: any[] = [];
  updatedProjects?.forEach((updatedProject: Project) => {
    updatedProject.hosts.forEach((host: Host) => {
      host.hostDetailsByInventoryType.forEach((hostDetailByInventoryType: HostDetails) => {
        hostDetailByInventoryType.variables.forEach((variable: HostVariable) => {
          if (variable.updated && variable.type !== 'applied') {
            updatedVars.push(variable);
          }
        });
      });
    });
  });
  return updatedVars;
}

export const codeChangesReducer = (
  state = initialState,
  action: CodeChangesAction,
): CodeChangesState => {
  switch (action.type) {
    case actionTypes.SWITCH_MODE:
      return { ...state, isInEditMode: !state.isInEditMode };
    case actionTypes.SHOW_HOST_DETAILS:
      return { ...state, selectedHostDetails: action.payload };
    case actionTypes.SHOW_VARIABLES:
      return { ...state, selectedVariables: action.payload };
    case actionTypes.CREATE_DIFF: {
      const updatedVars = getUpdatedVars(state.updatedProjects);

      const originalVars: any[] = [];
      state.originalProjects?.forEach((originalProject: Project) => {
        originalProject.hosts.forEach((host: Host) => {
          host.hostDetailsByInventoryType.forEach((hostDetailByInventoryType: HostDetails) => {
            hostDetailByInventoryType.variables.forEach((variable: HostVariable) => {
              if (
                updatedVars.some(
                  (updatedVar) => updatedVar.pathInProject === variable.pathInProject,
                )
              ) {
                originalVars.push(variable);
              }
            });
          });
        });
      });

      return {
        ...state,
        updatedVars,
        originalVars,
        originalDiff: originalVars[0],
        updatedDiff: updatedVars[0],
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

        const originalProject = state.originalProjects.find(
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

          const updatedVars = getUpdatedVars(state.updatedProjects);

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
                  }
                  return variable;
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
              console.log('this should not happen, because the project was already updated');
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
                }
              });
            } else {
              updatedUpdatedProjects = state.updatedProjects;
            }
          }
        } else {
          updatedOriginalProjects = state.originalProjects;
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
      // try to find the new selectedVariables inside original project to see if they the variable was updated (done for git)
      const originalSelectedVariables: HostVariable | undefined = findVariableObject(
        state.originalProjects,
        state.selectedVariables.pathInProject,
        projectName,
        hostname,
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
                // todo - tady je chyba, jelikož když do common vars například zadám jen nějaký klíč, nevyhodí to error, ale v applied se to ukáže fakt divně
                const stringifiedAppliedVariables = stringify(appliedVariables);
                console.log('appliedVariables: ', JSON.stringify(appliedVariables));
                console.log(
                  'stringifiedAppliedVariables: ',
                  JSON.stringify(stringifiedAppliedVariables),
                );
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

      const updatedProjectExistsInState = state.updatedProjects?.find(
        (project) => project.projectName === projectName,
      );
      let updatedProjects;
      if (updatedProjectExistsInState) {
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

export const createDiff = (): CodeChangesAction => ({
  type: actionTypes.CREATE_DIFF,
});

export const rollback = (payload: any): CodeChangesAction => ({
  type: actionTypes.ROLLBACK,
  payload,
});
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

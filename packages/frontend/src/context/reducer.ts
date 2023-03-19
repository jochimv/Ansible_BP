import keyMirror from 'keymirror';
import { parse as parseYaml, stringify } from 'yaml';
import { omit } from 'ramda';

const findVariableByPathInProject = (updatedProjects, path: string, projectNameArg: string) => {
  for (let i = 0; i < updatedProjects.length; i++) {
    const { hostDetailsByInventoryType, projectName } = updatedProjects[i];
    if (projectName === projectNameArg) {
      for (let j = 0; j < hostDetailsByInventoryType.length; j++) {
        const { variables } = hostDetailsByInventoryType[j];
        for (let k = 0; k < variables.length; k++) {
          const isTargetVariable = variables[k].pathInProject === path;
          if (isTargetVariable) {
            return variables[k];
          }
        }
      }
    }
  }
  return null;
};
interface VariableObject {
  type: string;
  pathInProject: string;
  values: string;
  updated?: boolean;
}

interface HostDetails {
  inventoryType: string;
  groupName: string;
  variables: VariableObject[];
}

interface Project {
  projectName: string;
  hostDetailsByInventoryType: HostDetails[];
}

function replaceVariable(projects: Project[], replacement: VariableObject): Project[] {
  return projects.map((project) => {
    const updatedSelectedHostDetailsByInventoryType = project.hostDetailsByInventoryType.map(
      (hostDetail) => {
        const updatedVariables = hostDetail.variables.map((variable) => {
          if (
            variable.type === replacement.type &&
            variable.pathInProject === replacement.pathInProject
          ) {
            return replacement;
          }
          return variable;
        });
        return { ...hostDetail, variables: updatedVariables };
      },
    );
    return {
      ...project,
      hostDetailsByInventoryType: updatedSelectedHostDetailsByInventoryType,
    };
  });
}

export interface HostDetails {
  inventoryType: string;
  groupName: string;
  variables: Variable[];
}

export interface Variable {
  type: string;
  pathInProject: string;
  variables: any[];
}

interface CodeChangesState {
  isInEditMode: boolean;
  selectedHostDetailsByInventoryType: HostDetails[];
  selectedHostDetails?: HostDetails;
  selectedVariables: any;
  updatedProjects: any[];
  originalProjects: any[];
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
  newDiff: undefined,
  originalVars: [],
  newVars: [],
};

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
      const newVars: any[] = [];
      state.updatedProjects.forEach((host) => {
        host.hostDetailsByInventoryType.forEach((hostDetail) => {
          hostDetail.variables.forEach((variable) => {
            if (variable.updated && variable.type !== 'applied') {
              newVars.push(variable);
            }
          });
        });
      });

      const originalVars: any[] = [];
      state.originalProjects.forEach((host) => {
        host.hostDetailsByInventoryType.forEach((hostDetail) => {
          hostDetail.variables.forEach((variable) => {
            if (newVars.some((updatedVar) => updatedVar.pathInProject === variable.pathInProject)) {
              originalVars.push(variable);
            }
          });
        });
      });
      return {
        ...state,
        newVars,
        originalVars,
        originalDiff: originalVars[0],
        newDiff: newVars[0],
      };
    }
    case actionTypes.INITIALIZE_EDITOR: {
      const { hostDetailsByInventoryType, projectName } = action.payload;
      const selectedHostDetails = hostDetailsByInventoryType[0];
      const selectedVariables = selectedHostDetails.variables[0];
      const isAlreadyInOriginalProjects = state.originalProjects.find(
        (host) => host.projectName === projectName,
      );

      return {
        ...state,
        selectedHostDetailsByInventoryType: hostDetailsByInventoryType,
        originalProjects: isAlreadyInOriginalProjects
          ? state.originalProjects
          : [...state.originalProjects, { projectName, hostDetailsByInventoryType }],
        updatedProjects: isAlreadyInOriginalProjects
          ? state.updatedProjects
          : [...state.updatedProjects, { projectName, hostDetailsByInventoryType }],
        selectedHostDetails,
        selectedVariables,
      };
    }
    case actionTypes.SHOW_DIFF: {
      const { originalVars, newVars } = state;
      const newSelectedDiffPath = action.payload;

      const originalDiff = originalVars.find(
        (variable) => variable.pathInProject === newSelectedDiffPath,
      );
      const newDiff = newVars.find((variable) => variable.pathInProject === newSelectedDiffPath);

      return {
        ...state,
        originalDiff,
        newDiff,
      };
    }
    case actionTypes.ROLLBACK: {
      const { pathInProject } = action.payload;

      const updatedOriginalVars = state.originalVars.filter(
        (variable) => variable.pathInProject !== pathInProject,
      );
      const updatedNewVars = state.newVars.filter(
        (variable) => variable.pathInProject !== pathInProject,
      );

      const projectName = pathInProject.split('\\')[1];
      const originalVars = findVariableByPathInProject(
        state.originalProjects,
        pathInProject,
        projectName,
      );
      const updatedProjects = replaceVariable(state.updatedProjects, originalVars);

      return {
        ...state,
        originalVars: updatedOriginalVars,
        newVars: updatedNewVars,
        originalDiff: updatedOriginalVars[0],
        newDiff: updatedNewVars[0],
        updatedProjects,
      };
    }
    case actionTypes.UPDATE_VARIABLES: {
      const { newEditorValue, projectName } = action.payload;
      let error: any;
      try {
        parseYaml(newEditorValue);
      } catch (e) {
        error = e.message;
      }

      let updatedSelectedVariables = omit(['updated'], {
        ...state.selectedVariables,
        error,
        values: newEditorValue,
      });
      const originalSelectedVariables = findVariableByPathInProject(
        state.originalProjects,
        state.selectedVariables.pathInProject,
        projectName,
      );

      updatedSelectedVariables = {
        ...updatedSelectedVariables,
        updated:
          JSON.stringify(updatedSelectedVariables) !== JSON.stringify(originalSelectedVariables),
      };
      const updatedVariablesSelectedOnly = state.selectedHostDetails?.variables.map((variable) => {
        if (variable.pathInProject === state.selectedVariables.pathInProject) {
          return updatedSelectedVariables;
        } else {
          return variable;
        }
      });

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

                // prevent monaco editor bug
                const stringifiedAppliedVariables = stringify(appliedVariables).trim();
                const appliedVariablesToShow =
                  stringifiedAppliedVariables === '{}' ? '' : stringifiedAppliedVariables;

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
          });

      const updatedHostDetailsByInventoryType = state.selectedHostDetailsByInventoryType.map(
        (hostDetail) => {
          if (hostDetail.inventoryType === state.selectedHostDetails?.inventoryType) {
            return {
              ...hostDetail,
              variables: updatedVariablesAll,
            };
          } else {
            return hostDetail;
          }
        },
      );

      const updatedSelectedHostDetails = {
        ...state.selectedHostDetails,
        variables: updatedVariablesAll,
      };

      const updatedProjects = state.updatedProjects.map((hostDetailsByInventoryType) => {
        if (hostDetailsByInventoryType.projectName === projectName) {
          return { projectName, hostDetailsByInventoryType: updatedHostDetailsByInventoryType };
        } else {
          return hostDetailsByInventoryType;
        }
      });

      return {
        ...state,
        selectedVariables: updatedSelectedVariables,
        selectedHostDetails: updatedSelectedHostDetails,
        hostDetailsByInventoryType: updatedHostDetailsByInventoryType,
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

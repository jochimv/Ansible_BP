import keyMirror from 'keymirror';

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
  hostDetailsByInventoryType: HostDetails[];
  hostDetails?: HostDetails;
  selectedVariables: any;
}
interface CodeChangesAction {
  type: string;
  payload?: any;
}
export const actionTypes = keyMirror({
  SWITCH_MODE: null,
  ADD_HOST_DETAILS_BY_INVENTORY_TYPE: null,
  UPDATE_HOST_DETAILS_BY_INVENTORY_TYPE: null,
  SHOW_HOST_DETAILS: null,
  SHOW_VARIABLES: null,
});
export const initialState: CodeChangesState = {
  isInEditMode: false,
  hostDetailsByInventoryType: [],
  hostDetails: undefined,
  selectedVariables: undefined,
};

/*function updateValues(arr, variables, newValues) {
  return arr.map((obj) => {
    const matchingVar = obj.variables.find(
      (v) => v.pathInProject === variables.pathInProject && v.type === variables.type,
    );
    if (matchingVar) {
      return {
        ...obj,
        variables: obj.variables.map((v) => {
          if (v === matchingVar) {
            return {
              ...v,
              values: {
                ...v.values,
                ...newValues,
              },
            };
          } else {
            return v;
          }
        }),
      };
    } else {
      return obj;
    }
  });
}*/
const update = (hostDetailsByInventoryType, hostDetails, selectedVariables, newValues) => {
  return hostDetailsByInventoryType.map((host) => {
    if (host.inventoryType === hostDetails.inventoryType) {
      const updatedVariables = host.variables.map((variable) => {
        if (
          variable.type === selectedVariables.type &&
          variable.pathInProject === selectedVariables.pathInProject
        ) {
          return { ...variable, values: newValues };
        }
        return variable;
      });
      return { ...host, variables: updatedVariables };
    }
    return host;
  });
};
export const codeChangesReducer = (
  state = initialState,
  action: CodeChangesAction,
): CodeChangesState => {
  switch (action.type) {
    case actionTypes.SWITCH_MODE:
      return { ...state, isInEditMode: !state.isInEditMode };
    case actionTypes.ADD_HOST_DETAILS_BY_INVENTORY_TYPE:
      return { ...state, hostDetailsByInventoryType: action.payload };
    case actionTypes.SHOW_HOST_DETAILS:
      return { ...state, hostDetails: action.payload };
    case actionTypes.SHOW_VARIABLES:
      return { ...state, selectedVariables: action.payload };
    default:
      return state;
  }
};
export const switchMode = (): CodeChangesAction => ({ type: actionTypes.SWITCH_MODE });

export const addHostDetailsByInventory = (payload: any): CodeChangesAction => ({
  type: actionTypes.ADD_HOST_DETAILS_BY_INVENTORY_TYPE,
  payload,
});

export const updateHostDetailsByInventoryType = (payload: any): CodeChangesAction => ({
  type: actionTypes.UPDATE_HOST_DETAILS_BY_INVENTORY_TYPE,
  payload,
});

export const showHostDetails = (payload: any): CodeChangesAction => ({
  type: actionTypes.SHOW_HOST_DETAILS,
  payload,
});

export const showVariables = (payload: any): CodeChangesAction => ({
  type: actionTypes.SHOW_VARIABLES,
  payload,
});

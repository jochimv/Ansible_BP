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
  SHOW_HOST_DETAILS: null,
  SHOW_VARIABLES: null,
  INITIALIZE_EDITOR: null,
  UPDATE_VARIABLES: null,
});
export const initialState: CodeChangesState = {
  isInEditMode: false,
  hostDetailsByInventoryType: [],
  hostDetails: undefined,
  selectedVariables: undefined,
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
    case actionTypes.INITIALIZE_EDITOR: {
      const hostDetailsByInventoryType = action.payload;
      const hostDetails = hostDetailsByInventoryType[0];
      const selectedVariables = hostDetails.variables[0];
      return { ...state, hostDetailsByInventoryType, hostDetails, selectedVariables };
    }
    case actionTypes.UPDATE_VARIABLES: {
      const updatedHostDetailsByInventoryType = state.hostDetailsByInventoryType.map(
        (hostDetail) => {
          if (hostDetail.inventoryType === state.hostDetails?.inventoryType) {
            return {
              ...hostDetail,
              variables: hostDetail.variables.map((variable) => {
                if (variable.pathInProject === state.selectedVariables.pathInProject) {
                  return { ...variable, values: action.payload };
                } else {
                  return variable;
                }
              }),
            };
          } else {
            return hostDetail;
          }
        },
      );
      const updatedHostDetails = {
        ...state.hostDetails,
        variables: state.hostDetails?.variables.map((variable) => {
          if (variable.pathInProject === state.selectedVariables.pathInProject) {
            return { ...variable, values: action.payload };
          } else {
            return variable;
          }
        }),
      };
      const updatedSelectedVariables = {
        ...state.selectedVariables,
        values: action.payload,
      };
      return {
        ...state,
        selectedVariables: updatedSelectedVariables,
        hostDetails: updatedHostDetails,
        hostDetailsByInventoryType: updatedHostDetailsByInventoryType,
      };
    }
    default:
      return state;
  }
};

export const switchMode = (): CodeChangesAction => ({ type: actionTypes.SWITCH_MODE });

export const addHostDetailsByInventory = (payload: any): CodeChangesAction => ({
  type: actionTypes.ADD_HOST_DETAILS_BY_INVENTORY_TYPE,
  payload,
});

export const updateVariables = (payload: any): CodeChangesAction => ({
  type: actionTypes.UPDATE_VARIABLES,
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

export const initializeEditor = (payload: any): CodeChangesAction => ({
  type: actionTypes.INITIALIZE_EDITOR,
  payload,
});

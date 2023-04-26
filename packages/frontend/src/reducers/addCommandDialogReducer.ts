import keyMirror from 'keymirror';
import { ProjectPlaybook, ReducerAction } from '@frontend/types';

const actionTypes = keyMirror({
  SET_ALIAS: null,
  SET_SELECTED_PLAYBOOK: null,
  SET_SELECTED_INVENTORY_TYPE: null,
  SET_SELECTED_INVENTORY_PATH: null,
  SET_SELECTED_GROUP: null,
  SET_SELECTED_HOST: null,
  SET_ADDITIONAL_VARIABLES: null,
  SET_COMMAND: null,
  TOGGLE_PLAYBOOK_PREVIEW: null,
  SET_MODE: null,
  CLEAR: null,
  INITIALIZE_FIELDS: null,
  INITIALIZE_BUILDER_FIELDS: null,
});

export const commandMode = keyMirror({
  BUILDER: null,
  AD_HOC: null,
});

interface CommandDialogState {
  alias: string;
  selectedPlaybook: ProjectPlaybook | null;
  selectedInventoryType: string | null;
  selectedInventoryPath: string | null;
  selectedHost: string | null;
  selectedGroup: string | null;
  additionalVariables: string | null;
  command: string;
  showPlaybookPreview: boolean;
  mode: string;
}
export const initialState: CommandDialogState = {
  alias: '',
  selectedPlaybook: null,
  selectedInventoryType: null,
  selectedInventoryPath: null,
  selectedGroup: null,
  selectedHost: null,
  additionalVariables: '',
  command: '',
  showPlaybookPreview: false,
  mode: commandMode.BUILDER,
};

export const commandDialogReducer = (state: CommandDialogState, action: ReducerAction) => {
  switch (action.type) {
    case actionTypes.SET_ALIAS:
      return { ...state, alias: action.payload };
    case actionTypes.SET_SELECTED_PLAYBOOK:
      return { ...state, selectedPlaybook: action.payload };
    case actionTypes.SET_SELECTED_INVENTORY_TYPE:
      return { ...state, selectedInventoryType: action.payload };
    case actionTypes.SET_SELECTED_INVENTORY_PATH:
      return { ...state, selectedInventoryPath: action.payload };
    case actionTypes.SET_SELECTED_GROUP:
      return { ...state, selectedGroup: action.payload };
    case actionTypes.SET_SELECTED_HOST:
      return { ...state, selectedHost: action.payload };
    case actionTypes.SET_ADDITIONAL_VARIABLES:
      return { ...state, additionalVariables: action.payload };
    case actionTypes.SET_COMMAND:
      return { ...state, command: action.payload };
    case actionTypes.TOGGLE_PLAYBOOK_PREVIEW:
      return { ...state, showPlaybookPreview: !state.showPlaybookPreview };
    case actionTypes.SET_MODE:
      return { ...state, mode: action.payload };
    case actionTypes.CLEAR:
      return initialState;
    case actionTypes.INITIALIZE_FIELDS: {
      return {
        ...state,
        ...action.payload,
      };
    }
    default:
      return state;
  }
};

export const setAlias = (payload: any) => ({
  type: actionTypes.SET_ALIAS,
  payload,
});

export const setSelectedPlaybook = (payload: any) => ({
  type: actionTypes.SET_SELECTED_PLAYBOOK,
  payload,
});

export const setSelectedInventoryType = (payload: any) => ({
  type: actionTypes.SET_SELECTED_INVENTORY_TYPE,
  payload,
});

export const setSelectedInventoryPath = (payload: any) => ({
  type: actionTypes.SET_SELECTED_INVENTORY_PATH,
  payload,
});

export const setSelectedGroup = (payload: any) => ({
  type: actionTypes.SET_SELECTED_GROUP,
  payload,
});

export const setSelectedHost = (payload: any) => ({
  type: actionTypes.SET_SELECTED_HOST,
  payload,
});

export const setAdditionalVariables = (payload: any) => ({
  type: actionTypes.SET_ADDITIONAL_VARIABLES,
  payload,
});

export const setCommand = (payload: any) => ({
  type: actionTypes.SET_COMMAND,
  payload,
});

export const togglePlaybookPreviewState = () => ({
  type: actionTypes.TOGGLE_PLAYBOOK_PREVIEW,
});

export const setMode = (payload: any) => ({
  type: actionTypes.SET_MODE,
  payload,
});

export const clear = () => ({ type: actionTypes.CLEAR });

export const initializeFields = (payload: any) => ({
  type: actionTypes.INITIALIZE_FIELDS,
  payload,
});

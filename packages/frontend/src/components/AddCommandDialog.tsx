/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Autocomplete,
  Stack,
  IconButton,
  Button,
  ButtonGroup,
  AutocompleteRenderInputParams,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import React, { SyntheticEvent, useEffect, useReducer } from 'react';
import { useCommandContext } from '@frontend/context/CommandContext';
import { CloseButton } from '@frontend/components/CloseButton';
import ConfirmButton from '@frontend/components/ConfirmButton';
import { useQuery } from 'react-query';
import { useRouter } from 'next/router';
import axios, { AxiosResponse } from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Command,
  ProjectCommand,
  ProjectDetailsAndPlaybooks,
  ProjectDetailsGroup,
  ProjectDetailsHost,
  ProjectDetailsInventory,
  ProjectPlaybook,
} from '@frontend/types';
import { BE_BASE_URL } from '@frontend/constants';
import {
  clear,
  commandDialogReducer,
  initializeFields,
  initialState,
  setAdditionalVariables,
  setAlias,
  setMode,
  setCommand,
  setSelectedGroup,
  setSelectedHost,
  setSelectedInventoryPath,
  setSelectedInventoryType,
  setSelectedPlaybook,
  togglePlaybookPreviewState,
  commandMode,
} from '@frontend/reducers/addCommandDialogReducer';
import { omit } from 'ramda';
import LoadingDialog from '@frontend/components/LoadingDialog';

interface AddCommandDialogProps {
  open: boolean;
  onClose: () => void;
  initialCommand?: Command;
  TransitionProps: any;
}

const fetchProjectPlaybooksAndDetails = async (projectName: string): Promise<ProjectDetailsAndPlaybooks> => {
  const data: AxiosResponse<any> = await axios.get(`${BE_BASE_URL}/${projectName}/details-playbooks`);
  return data.data;
};

const AddCommandDialog = ({ open, onClose, initialCommand, TransitionProps }: AddCommandDialogProps) => {
  const [state, dispatch] = useReducer(commandDialogReducer, initialState);
  const {
    alias,
    selectedPlaybook,
    selectedInventoryType,
    selectedInventoryPath,
    selectedGroup,
    selectedHost,
    additionalVariables,
    command,
    showPlaybookPreview,
    mode,
  } = state;
  const { addCommand, updateCommand } = useCommandContext();
  const { projectName } = useRouter().query;
  const { projectsCommands } = useCommandContext();
  const commands = projectsCommands.find((projectCommands: ProjectCommand) => projectCommands.projectName === projectName)?.commands || [];

  const sameAliasError =
    initialCommand === undefined
      ? !!commands.find((command: Command) => command.alias === alias)
      : !!commands.find((command: Command) => command.alias === alias && command.id !== initialCommand.id);

  const togglePlaybookPreview = () => {
    dispatch(togglePlaybookPreviewState());
  };

  useEffect(() => {
    if (initialCommand) {
      const baseFields = omit(['builderData'], initialCommand);
      dispatch(initializeFields(baseFields));
      if (initialCommand.mode === commandMode.BUILDER && initialCommand.builderData) {
        dispatch(initializeFields(initialCommand.builderData));
      }
    } else {
      dispatch(clear());
    }
  }, [initialCommand, open]);

  const assembleCommand = () => {
    let command = 'ansible-playbook';

    if (selectedPlaybook) {
      command += ` ${selectedPlaybook.playbookName}`;
    }

    if (selectedInventoryType) {
      command += ` -i ${selectedInventoryPath}`;
    }

    if (selectedGroup) {
      command += ` --limit ${selectedGroup}`;
    } else if (selectedHost) {
      command += ` --limit ${selectedHost}`;
    }

    if (additionalVariables) {
      command += ` -e "${additionalVariables}"`;
    }

    dispatch(setCommand(command));
  };

  const areBuilderRequiredFieldsFilled = () =>
    alias.trim() !== '' && selectedPlaybook !== null && selectedInventoryType !== null && (selectedGroup !== null || selectedHost !== null);

  const areAdHocRequiredFieldsFilled = () => alias.trim() !== '' && command.trim() !== '';

  useEffect(() => {
    assembleCommand();
  }, [selectedPlaybook, selectedInventoryType, selectedGroup, selectedHost, additionalVariables]);

  const { data, isLoading, isSuccess } = useQuery(
    ['project-playbooks-and-details', projectName],
    () => {
      if (typeof projectName === 'string') {
        return fetchProjectPlaybooksAndDetails(projectName);
      }
    },
    {
      enabled: !!projectName,
    },
  );

  if (isLoading || !isSuccess) {
    return <LoadingDialog open={open} onClose={onClose} TransitionProps={TransitionProps} />;
  }

  const { projectDetails, projectPlaybooks } = data!;
  const handleAddCommand = () => {
    if (alias.trim() && typeof projectName === 'string') {
      addCommand(
        projectName,
        command,
        alias,
        mode,
        mode === commandMode.BUILDER
          ? {
              selectedPlaybook,
              selectedInventoryType,
              selectedGroup,
              selectedInventoryPath,
              selectedHost,
              additionalVariables,
            }
          : undefined,
      );
      dispatch(setAlias(''));
    }
  };

  const inventoryTypes = projectDetails.map((detail: ProjectDetailsInventory) => detail.inventoryType) || [];
  const selectedInventory = projectDetails.find((detail: ProjectDetailsInventory) => detail.inventoryType === selectedInventoryType);
  const groupNames = selectedInventory?.groupHosts.map((group: ProjectDetailsGroup) => group.groupName) || [];
  const hostnames =
    selectedInventory?.groupHosts.flatMap((group: ProjectDetailsGroup) => group.hosts.map((host: ProjectDetailsHost) => host.hostname)) || [];

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} TransitionProps={TransitionProps}>
      <DialogTitle>{initialCommand ? `Modify ${initialCommand.alias}` : 'Add a new command'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} overflow="hidden">
          <ButtonGroup variant="outlined">
            <Button
              disabled={mode === commandMode.BUILDER}
              onClick={() => {
                dispatch(setMode(commandMode.BUILDER));
              }}
            >
              Builder
            </Button>
            <Button
              disabled={mode === commandMode.AD_HOC}
              onClick={() => {
                dispatch(setMode(commandMode.AD_HOC));
              }}
            >
              Ad-hoc
            </Button>
          </ButtonGroup>
          <TextField
            label="Alias"
            id="textfield-alias"
            value={alias}
            onChange={(e) => dispatch(setAlias(e.target.value))}
            fullWidth
            required
            error={sameAliasError}
            helperText={sameAliasError ? 'Command with this alias already exists' : undefined}
          />
          {mode === commandMode.BUILDER ? (
            <>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Autocomplete
                  id="autocomplete-playbooks"
                  options={projectPlaybooks}
                  getOptionLabel={(option: ProjectPlaybook) => option.playbookName}
                  isOptionEqualToValue={(option: ProjectPlaybook, value) => option.playbookName === value.playbookName}
                  onChange={(event, newValue) => dispatch(setSelectedPlaybook(newValue))}
                  renderInput={(params) => <TextField {...params} label="Select Playbook" required={!selectedPlaybook} />}
                  value={selectedPlaybook}
                  sx={{ flexGrow: 1 }}
                />
                {selectedPlaybook && (
                  <IconButton sx={{ height: 'max-content' }} onClick={togglePlaybookPreview}>
                    <VisibilityIcon />
                  </IconButton>
                )}
              </Stack>
              {showPlaybookPreview && (
                <Editor
                  height="200px"
                  language="yaml"
                  value={selectedPlaybook?.content}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                  }}
                />
              )}
              <Autocomplete
                id="autocomplete-inventory-type"
                options={inventoryTypes}
                onChange={(event: SyntheticEvent, newValue) => {
                  dispatch(setSelectedInventoryType(newValue));
                  const selectedInventory = projectDetails.find((inventory: any) => inventory.inventoryType === newValue)!;
                  dispatch(setSelectedInventoryPath(selectedInventory.inventoryPath));
                }}
                value={selectedInventoryType}
                renderInput={(params: AutocompleteRenderInputParams) => (
                  <TextField {...params} label="Select Inventory Type" required={!selectedInventoryType} />
                )}
                sx={{ flexGrow: 1 }}
              />
              {selectedInventoryType && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Autocomplete
                    id="autocomplete-groups"
                    fullWidth
                    options={groupNames}
                    onChange={(event, newValue) => {
                      dispatch(setSelectedGroup(newValue));
                      if (newValue) {
                        dispatch(setSelectedHost(null));
                      }
                    }}
                    value={selectedGroup}
                    renderInput={(params: AutocompleteRenderInputParams) => <TextField {...params} label="Select Group" />}
                  />
                  <Typography>OR</Typography>
                  <Autocomplete
                    fullWidth
                    options={[...new Set(hostnames)]}
                    onChange={(event, newValue) => {
                      dispatch(setSelectedHost(newValue as string | null));
                      if (newValue) {
                        dispatch(setSelectedGroup(null));
                      }
                    }}
                    value={selectedHost}
                    renderInput={(params: AutocompleteRenderInputParams) => <TextField {...params} label="Select Host" />}
                  />
                </Stack>
              )}
              <TextField
                fullWidth
                id="variables"
                label="Additional variables"
                value={additionalVariables}
                onChange={(e) => dispatch(setAdditionalVariables(e.target.value))}
              />
              <TextField fullWidth id="result" label="Result" value={command} InputProps={{ readOnly: true }} />
            </>
          ) : (
            <TextField fullWidth id="adhoc-command" label="Ad-hoc command" value={command} onChange={(e) => dispatch(setCommand(e.target.value))} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <ConfirmButton
          onClick={() => {
            if (initialCommand && typeof projectName === 'string') {
              updateCommand(
                projectName,
                initialCommand.id,
                command,
                alias,
                mode,
                mode === commandMode.BUILDER
                  ? {
                      selectedPlaybook,
                      selectedInventoryType,
                      selectedGroup,
                      selectedHost,
                      selectedInventoryPath,
                      additionalVariables,
                    }
                  : undefined,
              );
            } else {
              handleAddCommand();
            }
            onClose();
          }}
          id="button-add"
          disabled={(mode === commandMode.BUILDER ? !areBuilderRequiredFieldsFilled() : !areAdHocRequiredFieldsFilled()) || sameAliasError}
        >
          {initialCommand ? 'Save' : 'Add'}
        </ConfirmButton>
        <CloseButton onClick={onClose} color="primary">
          Cancel
        </CloseButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddCommandDialog;

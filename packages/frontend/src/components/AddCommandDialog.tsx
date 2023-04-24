import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Autocomplete,
  Stack,
  IconButton,
  Button,
  ButtonGroup,
  AutocompleteRenderInputParams,
} from '@mui/material';

import Editor from '@monaco-editor/react';
import React, { SyntheticEvent, useEffect, useState } from 'react';
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
import { BE_IP_ADDRESS } from '@frontend/constants';

interface AddCommandDialogProps {
  open: boolean;
  onClose: () => void;
  initialCommand?: Command;
  TransitionProps: any;
}

const fetchProjectPlaybooksAndDetails = async (
  projectName: string,
): Promise<ProjectDetailsAndPlaybooks> => {
  const data: AxiosResponse<any> = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/details-playbooks`,
  );
  return data.data;
};

const AddCommandDialog = ({
  open,
  onClose,
  initialCommand,
  TransitionProps,
}: AddCommandDialogProps) => {
  const [commandAlias, setCommandAlias] = useState('');
  const { addCommand, updateCommand } = useCommandContext();
  const { projectName } = useRouter().query;
  const { projectsCommands } = useCommandContext();
  const commands =
    projectsCommands.find(
      (projectCommands: ProjectCommand) => projectCommands.projectName === projectName,
    )?.commands || [];

  const sameAliasError =
    initialCommand === undefined
      ? !!commands.find((command: Command) => command.alias === commandAlias)
      : !!commands.find(
          (command: Command) => command.alias === commandAlias && command.id !== initialCommand.id,
        );

  const [selectedPlaybook, setSelectedPlaybook] = useState<ProjectPlaybook | null>(null);
  const [selectedInventoryType, setSelectedInventoryType] = useState<string | null>(null);
  const [selectedInventoryPath, setSelectedInventoryPath] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [additionalVariables, setAdditionalVariables] = useState('');
  const [resultCommand, setResultCommand] = useState('');
  const [showPlaybookPreview, setShowPlaybookPreview] = useState(false);
  const [mode, setMode] = useState<'builder' | 'ad-hoc'>('builder');

  const togglePlaybookPreview = () => {
    setShowPlaybookPreview((prev: boolean) => !prev);
  };

  useEffect(() => {
    if (initialCommand) {
      setCommandAlias(initialCommand.alias);
      setResultCommand(initialCommand.command);
      setMode(initialCommand.mode);
      if (initialCommand.mode === 'builder' && initialCommand.builderData) {
        setSelectedPlaybook(initialCommand.builderData.selectedPlaybook);
        setSelectedInventoryType(initialCommand.builderData.selectedInventoryType);
        setSelectedInventoryPath(initialCommand.builderData.selectedInventoryPath);
        setSelectedGroup(initialCommand.builderData.selectedGroup);
        setSelectedHost(initialCommand.builderData.selectedHost);
        setAdditionalVariables(initialCommand.builderData.additionalVariables);
      }
    } else {
      setCommandAlias('');
      setResultCommand('');
      setMode('builder');
      setSelectedPlaybook(null);
      setSelectedInventoryPath(null);
      setSelectedInventoryType(null);
      setSelectedGroup(null);
      setSelectedHost(null);
      setAdditionalVariables('');
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

    setResultCommand(command);
  };

  const areBuilderRequiredFieldsFilled = () =>
    commandAlias.trim() !== '' &&
    selectedPlaybook !== null &&
    selectedInventoryType !== null &&
    (selectedGroup !== null || selectedHost !== null);

  const areAdHocRequiredFieldsFilled = () =>
    commandAlias.trim() !== '' && resultCommand.trim() !== '';

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
    return (
      <Dialog open={open} onClose={onClose} TransitionProps={TransitionProps}>
        <DialogTitle>Loading details</DialogTitle>
        <DialogContent>
          <Stack alignItems="center" justifyContent="center">
            <CircularProgress size={70} />
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  const { projectDetails, projectPlaybooks } = data!;
  const handleAddCommand = () => {
    if (commandAlias.trim() && typeof projectName === 'string') {
      addCommand(
        projectName,
        resultCommand,
        commandAlias,
        mode,
        mode === 'builder'
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
      setCommandAlias('');
    }
  };

  const inventoryTypes =
    projectDetails.map((detail: ProjectDetailsInventory) => detail.inventoryType) || [];
  const selectedInventory = projectDetails.find(
    (detail: ProjectDetailsInventory) => detail.inventoryType === selectedInventoryType,
  );
  const groupNames =
    selectedInventory?.groupHosts.map((group: ProjectDetailsGroup) => group.groupName) || [];
  const hostnames =
    selectedInventory?.groupHosts.flatMap((group: ProjectDetailsGroup) =>
      group.hosts.map((host: ProjectDetailsHost) => host.hostname),
    ) || [];

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} TransitionProps={TransitionProps}>
      <DialogTitle>
        {initialCommand ? `Modify command ${initialCommand.alias}` : 'Add a new command'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <ButtonGroup variant="outlined">
            <Button
              disabled={mode === 'builder'}
              onClick={() => {
                setMode('builder');
              }}
            >
              Builder
            </Button>
            <Button
              disabled={mode === 'ad-hoc'}
              onClick={() => {
                setMode('ad-hoc');
              }}
            >
              Ad-hoc
            </Button>
          </ButtonGroup>
          {mode === 'builder' && (
            <>
              <TextField
                label="Alias"
                value={commandAlias}
                onChange={(e) => setCommandAlias(e.target.value)}
                fullWidth
                required
                error={sameAliasError}
                helperText={sameAliasError ? 'Command with this alias already exists' : undefined}
              />
              <Stack direction="row" alignItems="center" spacing={2}>
                <Autocomplete
                  options={projectPlaybooks}
                  getOptionLabel={(option: ProjectPlaybook) => option.playbookName}
                  onChange={(event, newValue) => setSelectedPlaybook(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Playbook" required={!selectedPlaybook} />
                  )}
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
                options={inventoryTypes}
                onChange={(event: SyntheticEvent, newValue) => {
                  setSelectedInventoryType(newValue);
                  const selectedInventory = projectDetails.find(
                    (inventory: any) => inventory.inventoryType === newValue,
                  )!;
                  setSelectedInventoryPath(selectedInventory.inventoryPath);
                }}
                value={selectedInventoryType}
                renderInput={(params: AutocompleteRenderInputParams) => (
                  <TextField
                    {...params}
                    label="Select Inventory Type"
                    required={!selectedInventoryType}
                  />
                )}
                sx={{ flexGrow: 1 }}
              />
              {selectedInventoryType && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Autocomplete
                    fullWidth
                    options={groupNames}
                    onChange={(event, newValue) => {
                      setSelectedGroup(newValue);
                      if (newValue) {
                        setSelectedHost(null);
                      }
                    }}
                    value={selectedGroup}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                      <TextField {...params} label="Select Group" />
                    )}
                  />
                  <Typography>OR</Typography>
                  <Autocomplete
                    fullWidth
                    options={[...new Set(hostnames)]}
                    onChange={(event, newValue) => {
                      setSelectedHost(newValue as string | null);
                      if (newValue) {
                        setSelectedGroup(null);
                      }
                    }}
                    value={selectedHost}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                      <TextField {...params} label="Select Host" />
                    )}
                  />
                </Stack>
              )}
              <TextField
                fullWidth
                id="variables"
                label="Additional variables"
                value={additionalVariables}
                onChange={(e) => setAdditionalVariables(e.target.value)}
              />
              <TextField
                fullWidth
                id="result"
                label="Result"
                value={resultCommand}
                InputProps={{ readOnly: true }}
              />
            </>
          )}
          {mode === 'ad-hoc' && (
            <>
              <TextField
                label="Alias"
                value={commandAlias}
                onChange={(e) => setCommandAlias(e.target.value)}
                fullWidth
                required
                error={sameAliasError}
                helperText={sameAliasError ? 'Command with this alias already exists' : undefined}
              />
              <TextField
                fullWidth
                id="adhoc-command"
                label="Ad-hoc command"
                value={resultCommand}
                onChange={(e) => setResultCommand(e.target.value)}
              />
            </>
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
                resultCommand,
                commandAlias,
                mode,
                mode === 'builder'
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
          disabled={
            (mode === 'builder'
              ? !areBuilderRequiredFieldsFilled()
              : !areAdHocRequiredFieldsFilled()) || sameAliasError
          }
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

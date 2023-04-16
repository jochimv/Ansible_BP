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
} from '@mui/material';
import Editor from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';
import { AnsibleCommand, useAnsibleCommands } from '@frontend/contexts/ansibleCommandContext';
import { CloseButton } from '@frontend/components/CloseButton';
import ConfirmButton from '@frontend/components/ConfirmButton';
import { useQuery } from 'react-query';
import { useRouter } from 'next/router';
import axios from 'axios';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import VisibilityIcon from '@mui/icons-material/Visibility';

import {
  ProjectDetailsGroup,
  ProjectDetailsHost,
  ProjectDetailsInventory,
} from '@frontend/utils/types';
interface AddCommandDialogProps {
  open: boolean;
  onClose: () => void;
  initialCommand?: AnsibleCommand;
}

interface ProjectPlaybook {
  playbookName: string;
  content: string;
}
const fetchProjectPlaybooksAndDetails = async (projectName: string) => {
  const data = await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/details-playbooks`);
  return data.data;
};

const AddCommandDialog = ({ open, onClose, initialCommand }: AddCommandDialogProps) => {
  const [commandAlias, setCommandAlias] = useState('');
  const { addCommand } = useAnsibleCommands();
  const { projectName } = useRouter().query;

  const [selectedPlaybook, setSelectedPlaybook] = useState<ProjectPlaybook | null>(null);
  const [selectedInventoryType, setSelectedInventoryType] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [additionalVariables, setAdditionalVariables] = useState('');
  const [resultCommand, setResultCommand] = useState('');
  const [showPlaybookPreview, setShowPlaybookPreview] = useState(false);
  const [mode, setMode] = useState<'builder' | 'ad-hoc'>('builder');

  const togglePlaybookPreview = () => {
    setShowPlaybookPreview((prev) => !prev);
  };

  useEffect(() => {
    if (initialCommand) {
      setCommandAlias(initialCommand.alias);
      setResultCommand(initialCommand.command);
      setMode(initialCommand.mode);

      if (initialCommand.mode === 'builder' && initialCommand.builderData) {
        setSelectedPlaybook(initialCommand.builderData.selectedPlaybook);
        setSelectedInventoryType(initialCommand.builderData.selectedInventoryType);
        setSelectedGroup(initialCommand.builderData.selectedGroup);
        setSelectedHost(initialCommand.builderData.selectedHost);
        setAdditionalVariables(initialCommand.builderData.additionalVariables);
      }
    } else {
      setCommandAlias('');
      setResultCommand('');
      setMode('builder');
      setSelectedPlaybook(null);
      setSelectedInventoryType(null);
      setSelectedGroup(null);
      setSelectedHost(null);
      setAdditionalVariables('');
    }
  }, [initialCommand]);

  const assembleCommand = () => {
    let command = 'ansible-playbook';

    if (selectedPlaybook) {
      command += ` ${selectedPlaybook.playbookName}`;
    }

    if (selectedInventoryType) {
      command += ` -i ${selectedInventoryType}`;
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
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Loading details</DialogTitle>
        <DialogContent>
          <Stack alignItems="center" justifyContent="center">
            <CircularProgress size={70} />
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  const { projectDetails, projectPlaybooks } = data;
  const handleAddCommand = () => {
    if (commandAlias.trim()) {
      addCommand(
        resultCommand,
        commandAlias,
        mode,
        mode === 'builder'
          ? {
              selectedPlaybook,
              selectedInventoryType,
              selectedGroup,
              selectedHost,
              additionalVariables,
            }
          : undefined,
      );
      setCommandAlias('');
    }
  };

  const inventoryTypes =
    projectDetails?.projectDetails.map((detail: ProjectDetailsInventory) => detail.inventoryType) ||
    [];
  const selectedInventory = projectDetails?.projectDetails.find(
    (detail: ProjectDetailsInventory) => detail.inventoryType === selectedInventoryType,
  );
  const groupNames =
    selectedInventory?.groupHosts.map((group: ProjectDetailsGroup) => group.groupName) || [];
  const hostnames =
    selectedInventory?.groupHosts.flatMap((group: ProjectDetailsGroup) =>
      group.hosts.map((host: ProjectDetailsHost) => host.hostname),
    ) || [];

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>Add a new command</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <ButtonGroup variant="outlined">
            <Button disabled={mode === 'builder'} onClick={() => setMode('builder')}>
              Builder
            </Button>
            <Button disabled={mode === 'ad-hoc'} onClick={() => setMode('ad-hoc')}>
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
                onChange={(event, newValue) => setSelectedInventoryType(newValue)}
                value={selectedInventoryType}
                renderInput={(params) => (
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
                    renderInput={(params) => <TextField {...params} label="Select Group" />}
                  />
                  <Typography>OR</Typography>
                  <Autocomplete
                    fullWidth
                    options={hostnames}
                    onChange={(event, newValue) => {
                      setSelectedHost(newValue);
                      if (newValue) {
                        setSelectedGroup(null);
                      }
                    }}
                    value={selectedHost}
                    renderInput={(params) => <TextField {...params} label="Select Host" />}
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
            handleAddCommand();
            onClose();
          }}
          disabled={
            mode === 'builder' ? !areBuilderRequiredFieldsFilled() : !areAdHocRequiredFieldsFilled()
          }
        >
          Add
        </ConfirmButton>
        <CloseButton onClick={onClose} color="primary">
          Cancel
        </CloseButton>
      </DialogActions>
    </Dialog>
  );
};

export default AddCommandDialog;

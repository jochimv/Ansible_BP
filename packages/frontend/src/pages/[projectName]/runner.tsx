import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Stack,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TableBody,
  TableContainer,
  Table,
  CircularProgress,
  Dialog,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import axios, { AxiosResponse } from 'axios';
import { Command, ProjectCommand, useCommandContext } from '@frontend/contexts/commandContext';
import { useMutation, useQuery } from 'react-query';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import AddCommandDialog from '@frontend/components/AddCommandDialog';
import EditIcon from '@mui/icons-material/Edit';
import { useSnackbar } from '@frontend/components/ImportProjectModal/state/SnackbarContext';
import { useRouter } from 'next/router';
import LoadingPage from '@frontend/components/pages/Loading';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import Terminal from '@frontend/components/Terminal';

const runCommand = (data: any) => axios.post(`http://${BE_IP_ADDRESS}:4000/run-command`, data);

const fetchProjectExists = async (projectName: string) =>
  await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/exists`);

const AnsibleCommandsPage: React.FC = () => {
  const { projectName } = useRouter().query;

  const { data, isLoading } = useQuery(['project-exists', projectName], () => {
    if (typeof projectName === 'string') {
      return fetchProjectExists(projectName);
    }
  });
  const { showMessage } = useSnackbar();
  const [commandOutput, setCommandOutput] = useState('');
  const { projectsCommands, removeCommand } = useCommandContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [openOutputDialog, setOpenOutputDialog] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<Command | undefined>();
  const [runningCommandIds, setRunningCommandIds] = useState<Set<number>>(new Set());
  const [filterText, setFilterText] = useState('');

  const { mutate } = useMutation(runCommand, {
    onSuccess: (data: AxiosResponse<any>) => {
      const { error, output } = data.data;
      const command = JSON.parse(data.config.data);
      const { commandId, alias } = command;
      stopRunningCommand(commandId);
      setCommandOutput(output);
      if (!error) {
        showMessageWithOutput(`${alias} finished successfully`, 'success');
      } else {
        showMessageWithOutput(`Could not execute ${alias}`, 'error');
      }
    },
  });
  if (isLoading) {
    return <LoadingPage />;
  } else if (!data?.data) {
    return <ProjectNotFound />;
  }

  const commands = projectsCommands.find(
    (projectCommands: ProjectCommand) => projectCommands.projectName === projectName,
  )?.commands;

  const filteredCommands = commands?.filter((command: Command) => {
    return command.alias.toLowerCase().includes(filterText.toLowerCase());
  });

  const handleOpenOutputDialog = () => {
    setOpenOutputDialog(true);
  };

  const handleCloseOutputDialog = () => {
    setOpenOutputDialog(false);
  };

  const showMessageWithOutput = (message: string, variant: 'success' | 'error') => {
    showMessage(
      message,
      variant,
      <Button color={variant} onClick={handleOpenOutputDialog}>
        Output
      </Button>,
    );
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const startRunningCommand = (commandId: number) => {
    setRunningCommandIds((prev: Set<number>) => new Set([...prev, commandId]));
  };

  const stopRunningCommand = (commandId: number) => {
    setRunningCommandIds((prev: Set<number>) => {
      const updatedSet = new Set([...prev]);
      updatedSet.delete(commandId);
      return updatedSet;
    });
  };

  return (
    <div>
      <AddCommandDialog
        open={openDialog}
        onClose={() => {
          handleCloseDialog();
        }}
        TransitionProps={{
          onExited: () => {
            setCurrentCommand(undefined);
          },
        }}
        initialCommand={currentCommand}
      />
      <Stack direction="row" spacing={3} mb={2}>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Add Command
        </Button>
        <TextField
          size="small"
          label="Filter by alias"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          variant="outlined"
        />
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="30%">
                <Typography fontWeight="bold">Alias</Typography>
              </TableCell>
              <TableCell width="60%">
                <Typography fontWeight="bold">Command</Typography>
              </TableCell>
              <TableCell width="10%">
                <Typography fontWeight="bold">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCommands?.map((commandObj: Command) => {
              const { id, alias, command } = commandObj;
              return (
                <TableRow key={id}>
                  <TableCell>{alias}</TableCell>
                  <TableCell>{command}</TableCell>
                  <TableCell>
                    <Stack direction="row" columnGap={2} alignItems="center">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setCurrentCommand(commandObj);
                          handleOpenDialog();
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {runningCommandIds.has(id) ? (
                        <CircularProgress size={30} />
                      ) : (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => {
                            startRunningCommand(id);
                            mutate({ command, commandId: id, alias, projectName });
                          }}
                        >
                          <PlayCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="delete"
                        onClick={() => {
                          if (typeof projectName === 'string') {
                            removeCommand(projectName, id);
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openOutputDialog} onClose={handleCloseOutputDialog} maxWidth="md" fullWidth>
        <Terminal output={commandOutput} />
      </Dialog>
    </div>
  );
};

export default AnsibleCommandsPage;

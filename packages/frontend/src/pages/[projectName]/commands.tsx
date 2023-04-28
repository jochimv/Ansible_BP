/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Details: A page for building and executing commands on backend for given project.
 */

import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Delete as DeleteIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import { useCommandContext } from '@frontend/context/CommandContext';
import AddCommandDialog from '@frontend/components/AddCommandDialog';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/router';
import LoadingPage from '@frontend/components/Loading';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import { useRunCommand } from '@frontend/hooks/useRunCommand';
import { useProjectExists } from '@frontend/hooks/useProjectExists';
import { Command, ProjectCommand } from '@frontend/types';
import TerminalDialog from '@frontend/components/TerminalDialog';

const AnsibleCommandsPage: React.FC = () => {
  const { projectName } = useRouter().query;

  const { data, isLoading } = useProjectExists(projectName);

  const { projectsCommands, removeCommand } = useCommandContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<Command | undefined>();
  const [filterText, setFilterText] = useState('');

  const {
    runCommand,
    runningCommandIds,
    openOutputDialog,
    handleCloseOutputDialog,
    commandOutput,
  } = useRunCommand();
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

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Box mt={1}>
        <TerminalDialog
          output={commandOutput}
          open={openOutputDialog}
          onClose={handleCloseOutputDialog}
        />
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
          <Button
            id="button-add-command"
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            startIcon={<AddIcon />}
          >
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
              {filteredCommands?.map((commandObj: Command, index: number) => {
                const { id, alias, command } = commandObj;
                return (
                  <TableRow key={id} id={`command-${index}`}>
                    <TableCell id={`command-${index}-alias`}>{alias}</TableCell>
                    <TableCell>{command}</TableCell>
                    <TableCell>
                      <Stack direction="row" columnGap={2} alignItems="center">
                        <IconButton
                          edge="end"
                          id={`edit-command-${index}`}
                          aria-label="edit"
                          onClick={() => {
                            setCurrentCommand(commandObj);
                            handleOpenDialog();
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        {runningCommandIds.has(id) ? (
                          <CircularProgress size={28} />
                        ) : (
                          <IconButton
                            id={`run-command-${index}`}
                            edge="end"
                            aria-label="run"
                            onClick={() => {
                              runCommand(id, alias, projectName, command);
                            }}
                          >
                            <PlayCircleIcon />
                          </IconButton>
                        )}
                        <IconButton
                          id={`delete-command-${index}`}
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
      </Box>
    </>
  );
};

export default AnsibleCommandsPage;

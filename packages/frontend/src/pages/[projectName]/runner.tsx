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
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import { Command, ProjectCommand, useCommandContext } from '@frontend/contexts/commandContext';
import { useQuery } from 'react-query';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import AddCommandDialog from '@frontend/components/AddCommandDialog';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/router';
import LoadingPage from '@frontend/components/pages/Loading';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import { useRunCommand } from '@frontend/hooks/useRunCommand';

const fetchProjectExists = async (projectName: string) =>
  await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/exists`);

export const useProjectExists = (projectName: string | string[] | undefined) =>
  useQuery(['project-exists', projectName], () => {
    if (typeof projectName === 'string') {
      return fetchProjectExists(projectName);
    }
  });

const AnsibleCommandsPage: React.FC = () => {
  const { projectName } = useRouter().query;

  const { data, isLoading } = useProjectExists(projectName);

  const { projectsCommands, removeCommand } = useCommandContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<Command | undefined>();
  const [filterText, setFilterText] = useState('');

  const { runCommand, runningCommandIds, OutputDialog } = useRunCommand();
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
                        <CircularProgress size={28} />
                      ) : (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => {
                            runCommand(id, alias, projectName, command);
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
      <OutputDialog />
    </div>
  );
};

export default AnsibleCommandsPage;

import React, { useState } from 'react';
import {
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import {
  AnsibleCommand,
  AnsibleCommandsProvider,
  useAnsibleCommands,
} from '@frontend/contexts/ansibleCommandContext';
import { useMutation } from 'react-query';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import AddCommandDialog from '@frontend/components/AddCommandDialog';
import EditIcon from '@mui/icons-material/Edit';

const postCommitData = (data: any) => axios.post(`http://${BE_IP_ADDRESS}:4000/run-command`, data);

const TerminalOutput: React.FC<{ output: string }> = ({ output }) => {
  const formattedOutput = output.replace(/\r\n/g, '\n');
  const outputLines = formattedOutput.split('\n');

  return (
    <pre
      style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {outputLines.map((line: string, index: number) => (
        <div key={index}>{line}</div>
      ))}
    </pre>
  );
};

const AnsibleCommandsPage: React.FC = () => {
  const [commandResult, setCommandResult] = useState('');
  const { commands, removeCommand } = useAnsibleCommands();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<AnsibleCommand | undefined>();
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const { mutate } = useMutation(postCommitData, {
    onSuccess: (data) => {
      setCommandResult(data.data);
    },
  });

  return (
    <div>
      <AddCommandDialog
        open={openDialog}
        onClose={handleCloseDialog}
        initialCommand={currentCommand}
      />
      <Button variant="contained" color="primary" onClick={handleOpenDialog}>
        Add Command
      </Button>
      <List>
        {commands.map((cmd: AnsibleCommand) => (
          <ListItem key={cmd.id}>
            <ListItemText primary={cmd.alias} />
            <ListItemSecondaryAction>
              <Stack direction="row" columnGap={2}>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => {
                    setCurrentCommand(cmd);
                    handleOpenDialog();
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => mutate({ command: cmd.command })}
                >
                  <PlayCircleIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => removeCommand(cmd.id)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <TerminalOutput output={commandResult} />
    </div>
  );
};

export default () => (
  <AnsibleCommandsProvider>
    <AnsibleCommandsPage />
  </AnsibleCommandsProvider>
);

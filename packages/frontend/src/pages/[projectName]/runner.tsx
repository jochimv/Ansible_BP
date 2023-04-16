// pages/ansible-commands.tsx
import React, { useState } from 'react';
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, PlayCircle as PlayCircleIcon } from '@mui/icons-material';
import axios from 'axios';
import {
  AnsibleCommandsProvider,
  useAnsibleCommands,
} from '@frontend/contexts/ansibleCommandContext';
import { useMutation } from 'react-query';

const postCommitData = (data: any) => axios.post('http://localhost:4000/run-command', data);

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
  const [newCommand, setNewCommand] = useState('');
  const [commandResult, setCommandResult] = useState('');
  const { commands, addCommand, removeCommand } = useAnsibleCommands();

  const handleAddCommand = () => {
    if (newCommand.trim()) {
      addCommand(newCommand);
      setNewCommand('');
    }
  };

  const { mutate } = useMutation(postCommitData, {
    onSuccess: (data) => {
      console.log('command finished successfully: ', JSON.stringify(data.data));
      setCommandResult(data.data);
    },
  });

  return (
    <div>
      <TextField
        label="New Ansible Command"
        value={newCommand}
        onChange={(e) => setNewCommand(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleAddCommand}>
        Add Command
      </Button>
      <List>
        {commands.map((cmd) => (
          <ListItem key={cmd.id}>
            <ListItemText primary={cmd.command} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => mutate({ command: cmd.command })}
              >
                <PlayCircleIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => removeCommand(cmd.id)}>
                <DeleteIcon />
              </IconButton>
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

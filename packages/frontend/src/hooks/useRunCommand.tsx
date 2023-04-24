import React, { useState } from 'react';
import { useMutation } from 'react-query';
import axios, { AxiosResponse } from 'axios';
import { Dialog, IconButton } from '@mui/material';
import { useSnackbar } from '@frontend/context/SnackbarContext';
import Terminal from '@frontend/components/Terminal';
import { Terminal as TerminalIcon } from '@mui/icons-material';
import { RunCommandOutput } from '@frontend/types';
import { RunCommandDto } from '@frontend/dto';
import { BE_IP_ADDRESS } from '@frontend/constants';
const performCommandExecutionOnBackend = (data: any) =>
  axios.post(`http://${BE_IP_ADDRESS}:4000/run-command`, data);

export const useRunCommand = (requestFinishedCallback?: () => void) => {
  const [openOutputDialog, setOpenOutputDialog] = useState(false);

  const { showMessage } = useSnackbar();
  const showMessageWithOutput = (message: string, variant: 'success' | 'error') => {
    showMessage(
      message,
      variant,
      <IconButton onClick={handleOpenOutputDialog}>
        <TerminalIcon sx={{ color: `${variant}.main` }} />
      </IconButton>,
    );
  };

  const handleOpenOutputDialog = () => {
    setOpenOutputDialog(true);
  };

  const handleCloseOutputDialog = () => {
    setOpenOutputDialog(false);
  };

  const [runningCommandIds, setRunningCommandIds] = useState<Set<number>>(new Set());
  const [commandOutput, setCommandOutput] = useState('');

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

  const { mutate } = useMutation(performCommandExecutionOnBackend, {
    onSuccess: (data: AxiosResponse<any>) => {
      const { success, output }: RunCommandOutput = data.data;
      const command: RunCommandDto = JSON.parse(data.config.data);
      const { commandId, alias }: RunCommandDto = command;
      stopRunningCommand(commandId);
      setCommandOutput(output);
      if (success) {
        showMessageWithOutput(`${alias} finished successfully`, 'success');
      } else {
        showMessageWithOutput(`Could not execute ${alias}`, 'error');
      }
      requestFinishedCallback?.();
    },
  });

  const OutputDialog = () => (
    <Dialog open={openOutputDialog} onClose={handleCloseOutputDialog} maxWidth="md" fullWidth>
      <Terminal output={commandOutput} />
    </Dialog>
  );

  const runCommand = (
    commandId: number,
    alias: string,
    projectName: string | string[] | undefined,
    command: string,
  ) => {
    startRunningCommand(commandId);
    mutate({ command, commandId, alias, projectName });
  };

  return {
    runCommand,
    runningCommandIds,
    OutputDialog,
  };
};

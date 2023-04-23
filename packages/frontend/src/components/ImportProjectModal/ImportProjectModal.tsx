import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { CloseButton } from '@frontend/components/CloseButton';
import DownloadIcon from '@mui/icons-material/Download';
import React, { useState, ChangeEvent } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useMutation } from 'react-query';
import { useSnackbar } from '@frontend/components/ImportProjectModal/state/SnackbarContext';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';
import { RepositoryActionResult } from '@frontend/types';
interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectName: string) => void;
}

const gitRepoUrlRegex = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@/:~-]+)(\.git)(\/)?/;

const importProjectByRepoUrl = async (data: any): Promise<RepositoryActionResult> => {
  const response: AxiosResponse<any> = await axios.post(
    `http://${BE_IP_ADDRESS}:4000/downloadRepository`,
    data,
  );
  return response.data;
};
const ImportProjectModal = ({ isOpen, onClose, onSuccess }: ImportProjectModalProps) => {
  const { showMessage } = useSnackbar();
  const { isLoading, mutate } = useMutation(importProjectByRepoUrl, {
    onSuccess: (result: RepositoryActionResult) => {
      const { success, error } = result;

      if (success) {
        const url = new URL(gitRepositoryUrl);
        const pathSegments = url.pathname.split('/');
        const projectName = pathSegments[pathSegments.length - 2];
        showMessage(`${projectName} imported successfully`, 'success');
        onSuccess(projectName);
        if (isOpen) {
          onClose();
        }
      }
      if (typeof error === 'string') {
        showMessage(error, 'error');
      } else {
        showMessage('An unknown error occurred', 'error');
      }
    },
    onError: () => {
      showMessage('An error occurred while importing the project', 'error');
    },
  });

  const [gitRepositoryUrl, setGitRepositoryUrl] = useState('');
  return (
    <Dialog open={isOpen}>
      <DialogTitle>Import repository</DialogTitle>
      {isLoading ? (
        <>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={70} />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} startIcon={<VisibilityOffIcon />}>
              Hide
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            <TextField
              sx={{ mt: 1 }}
              label="Enter git repository URL"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setGitRepositoryUrl(event.target.value);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              startIcon={<DownloadIcon />}
              color="success"
              disabled={!gitRepoUrlRegex.test(gitRepositoryUrl)}
              onClick={() => mutate({ gitRepositoryUrl })}
            >
              Import
            </Button>
            <CloseButton onClick={onClose}>Close</CloseButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ImportProjectModal;

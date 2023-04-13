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
import axios from 'axios';
import { useMutation } from 'react-query';
import { useSnackbar } from '@frontend/components/ImportProjectModal/state/SnackbarContext';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const gitRepoUrlRegex = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@/:~-]+)(\.git)(\/)?/;

const importProjectByRepoUrl = (data: any) =>
  axios.post('http://localhost:4000/downloadRepository', data);

const ImportProjectModal = ({ isOpen, onClose }: ImportProjectModalProps) => {
  const { showMessage } = useSnackbar();
  const { isLoading, mutate } = useMutation(importProjectByRepoUrl, {
    onSuccess: (response) => {
      if (response.data.success) {
        const url = new URL(gitRepositoryUrl);
        const pathSegments = url.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        const repoName = lastSegment.replace(/\.git$/, '');
        showMessage(`${repoName} imported successfully`, 'success');
        if (isOpen) {
          onClose();
        }
      } else {
        showMessage(response.data.error, 'error');
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

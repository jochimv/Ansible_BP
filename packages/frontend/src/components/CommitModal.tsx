import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  CheckCircle,
  Cancel,
  Repeat,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useMutation } from 'react-query';
import { useCodeChangesContext } from '@frontend/context/context';

interface Props {
  open: boolean;
  onClose: () => void;
}

const postCommitData = (data) => axios.post('http://localhost:4000/commit', data);

const CommitModal = ({ open, onClose: handleClose }: Props) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [commitBranchName, setCommitBranchName] = useState<string>('');
  const { selectedProjectName } = useCodeChangesContext();
  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(event.target.value);
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitBranchName(event.target.value);
  };
  const [response, setResponse] = useState();

  const { mutate, isLoading, reset } = useMutation(postCommitData, {
    onSuccess: (data) => setResponse(data.data),
  });
  const { updatedVars } = useCodeChangesContext();
  const handleCommit = () => {
    mutate({ commitMessage, commitBranchName, updatedVars, projectName: selectedProjectName });
  };

  const getModalContent = (isLoading, response) => {
    if (isLoading) {
      return (
        <>
          <DialogTitle>Pushing changes</DialogTitle>
          <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={70} />
          </DialogContent>
        </>
      );
    } else if (response) {
      return (
        <>
          <DialogTitle>Error caught</DialogTitle>
          <DialogContent>
            {response?.error ? (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
                <Cancel sx={{ width: 40, height: 40, color: 'error.main' }} />
                <Typography variant="h6">{response.error}</Typography>
              </Stack>
            ) : (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
                <CheckCircle sx={{ width: 40, height: 40, color: 'success.main' }} />
                <Typography variant="h4">Commit successful</Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setResponse(undefined);
                reset();
                handleCommit();
              }}
              startIcon={<ReplayIcon />}
              color="success"
            >
              Try again
            </Button>
            <Button color="error" onClick={handleClose} startIcon={<CloseIcon />}>
              Close
            </Button>
          </DialogActions>
        </>
      );
    } else {
      return (
        <>
          <DialogTitle>Commit Message</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="commit-message"
              label="Enter your commit message:"
              type="text"
              fullWidth
              variant="standard"
              value={commitMessage}
              onChange={handleCommitMessageChange}
            />
            <TextField
              margin="dense"
              id="branch-name"
              label="Enter a branch name"
              type="text"
              fullWidth
              variant="standard"
              value={commitBranchName}
              onChange={handleBranchNameChange}
            />
          </DialogContent>
          <DialogActions>
            <Button startIcon={<SendIcon />} onClick={handleCommit} color="success">
              Commit
            </Button>
            <Button onClick={handleClose} startIcon={<CloseIcon />} color="error">
              Cancel
            </Button>
          </DialogActions>
        </>
      );
    }
  };

  return (
    <Dialog
      TransitionProps={{
        onExited: () => {
          setResponse(undefined);
          reset();
        },
      }}
      open={open}
    >
      {getModalContent(isLoading, response)}
    </Dialog>
  );
};

export default CommitModal;

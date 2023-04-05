import React from 'react';
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
  Replay as ReplayIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useMutation } from 'react-query';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import { clearAllUpdates } from '@frontend/codeChanges/codeChangesReducer';
import { faCodePullRequest } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  close,
  updateCommitBranchName,
  updateCommitMessage,
  updateResponse,
} from '@frontend/components/CommitModal/state/commitModalReducer';
import {
  useCommitModalContext,
  useCommitModalDispatchContext,
} from '@frontend/components/CommitModal/state/CommitModalContext';

const postCommitData = (data: any) => axios.post('http://localhost:4000/commit', data);

const CloseButton = ({ children, ...other }) => (
  <Button {...other} color="error" startIcon={<CloseIcon />}>
    {children}
  </Button>
);

// todo - automatické načítání změn z backendu do /packagages/backend/ansible-repos
// todo - uložení credentials do .env variables

const CommitModal = () => {
  const { commitMessage, commitBranchName, response, isModalOpen } = useCommitModalContext();
  const commitModalDispatch = useCommitModalDispatchContext();

  const { selectedProjectName } = useCodeChangesContext();
  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitMessage(event.target.value));
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitBranchName(event.target.value));
  };

  const { isLoading, reset, mutateAsync } = useMutation(postCommitData, {
    onSuccess: (data) => commitModalDispatch(updateResponse(data.data)),
  });
  const { updatedVars } = useCodeChangesContext();
  const codeChangesDispatch = useCodeChangesDispatchContext();

  const closeModal = () => commitModalDispatch(close());
  const clearResponse = () => commitModalDispatch(updateResponse(undefined));

  const handleCommit = async () => {
    const data = await mutateAsync({
      commitMessage,
      commitBranchName,
      updatedVars,
      projectName: selectedProjectName,
    });
    if (!data.data?.error) {
      codeChangesDispatch(clearAllUpdates());
    }
  };

  const getModalContent = (isLoading: boolean, response: any) => {
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
      return response?.error ? (
        <>
          <DialogTitle>Error caught</DialogTitle>
          <DialogContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
              <Cancel sx={{ width: 40, height: 40, color: 'error.main' }} />
              <Typography variant="h6">{response.error}</Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                clearResponse();
                reset();
                handleCommit();
              }}
              startIcon={<ReplayIcon />}
              color="success"
            >
              Try again
            </Button>
            <CloseButton onClick={closeModal}>Close</CloseButton>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>Commit & push successful</DialogTitle>
          <DialogContent>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
              <CheckCircle sx={{ width: 40, height: 40, color: 'success.main' }} />
              <Typography variant="h4">Commit successful</Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              component={'a'}
              target="_blank"
              href={response.pullRequestUrl}
              startIcon={<FontAwesomeIcon icon={faCodePullRequest} />}
              color="success"
              onClick={closeModal}
            >
              Create PR
            </Button>
            <CloseButton onClick={closeModal}>Close</CloseButton>
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
            <CloseButton onClick={closeModal}>Cancel</CloseButton>
          </DialogActions>
        </>
      );
    }
  };

  return (
    <Dialog
      TransitionProps={{
        onExited: () => {
          clearResponse();
          reset();
        },
      }}
      open={isModalOpen}
    >
      {getModalContent(isLoading, response)}
    </Dialog>
  );
};

export default CommitModal;

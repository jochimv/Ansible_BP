import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Cancel, CheckCircle, Replay as ReplayIcon, Send as SendIcon } from '@mui/icons-material';
import axios, { AxiosResponse } from 'axios';
import { useMutation } from 'react-query';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { clearProjectUpdates } from '@frontend/reducers/codeChangesReducer';
import { faCodePullRequest } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  close,
  updateCommitBranchName,
  updateCommitMessage,
  updateResponse,
} from '@frontend/reducers/commitModalReducer';
import {
  useCommitModalContext,
  useCommitModalDispatchContext,
} from '@frontend/context/CommitModalContext';
import { CloseButton } from '@frontend/components/CloseButton';
import { CommitResponse } from '@frontend/types';
import { BE_IP_ADDRESS } from '@frontend/constants';

const postCommitData = async (data: any): Promise<CommitResponse> => {
  const response: AxiosResponse<any> = await axios.post(
    `http://${BE_IP_ADDRESS}:4000/commit`,
    data,
  );
  return response.data;
};

interface CommitModalProps {
  mainBranchName: string | null;
}

const CommitModal = ({ mainBranchName }: CommitModalProps) => {
  const { commitMessage, commitBranchName, response, isModalOpen } = useCommitModalContext();
  const commitModalDispatch = useCommitModalDispatchContext();

  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitMessage(event.target.value));
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitBranchName(event.target.value));
  };

  const { isLoading, reset, mutateAsync } = useMutation(postCommitData, {
    onSuccess: (data: CommitResponse) => commitModalDispatch(updateResponse(data)),
  });
  const { updatedVars, selectedProjectName } = useCodeChangesContext();
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
    if (!data.error) {
      codeChangesDispatch(clearProjectUpdates(selectedProjectName));
    }
  };

  const isCommitingToMainBranch = commitBranchName === mainBranchName;

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
              <Typography variant="h6" sx={{ wordWrap: 'break-word', overflow: 'auto' }}>
                {response.error}
              </Typography>
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
              margin="dense"
              id="branch-name"
              label="Enter a branch name"
              type="text"
              fullWidth
              variant="standard"
              error={isCommitingToMainBranch}
              helperText={
                isCommitingToMainBranch
                  ? 'You cannot commit directly to the main branch'
                  : undefined
              }
              value={commitBranchName}
              onChange={handleBranchNameChange}
            />
            <TextField
              autoFocus
              margin="dense"
              id="commit-message"
              label="Enter your commit message"
              type="text"
              fullWidth
              multiline
              variant="standard"
              value={commitMessage}
              onChange={handleCommitMessageChange}
            />
          </DialogContent>
          <DialogActions>
            <Button
              startIcon={<SendIcon />}
              onClick={handleCommit}
              color="success"
              disabled={isCommitingToMainBranch}
            >
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
      onClose={closeModal}
      TransitionProps={{
        onExited: () => {
          clearResponse();
          reset();
        },
      }}
      open={isModalOpen}
      maxWidth="sm"
      fullWidth
    >
      {getModalContent(isLoading, response)}
    </Dialog>
  );
};

export default CommitModal;

/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import React, { useEffect, useRef } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Cancel,
  ChatBubbleOutline,
  CheckCircle,
  Edit,
  Replay as ReplayIcon,
  Send as SendIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
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
  open,
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
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useSnackbar } from '@frontend/context/SnackbarContext';
import { Terminal } from '@frontend/components/Terminal';
import CommitIcon from '@mui/icons-material/Commit';
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
  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const commitModalDispatch = useCommitModalDispatchContext();
  const { showMessage } = useSnackbar();

  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitMessage(event.target.value));
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitModalDispatch(updateCommitBranchName(event.target.value));
  };

  const { isLoading, reset, mutateAsync } = useMutation(postCommitData, {
    onSuccess: (data: CommitResponse) => {
      const { error, pullRequestUrl } = data;
      commitModalDispatch(updateResponse(data));
      if (!isModalOpenRef.current && !error) {
        showMessage(
          'Commit successful',
          'success',
          <Button
            component={'a'}
            target="_blank"
            href={pullRequestUrl}
            startIcon={<FontAwesomeIcon icon={faCodePullRequest} />}
            color="success"
            onClick={closeModal}
          >
            Create PR
          </Button>,
        );
      } else if (!isModalOpenRef.current && error) {
        showMessage(
          'Error during commit',
          'error',
          <IconButton
            id="button-show-output"
            color="error"
            onClick={() => {
              commitModalDispatch(open());
            }}
          >
            <TerminalIcon />
          </IconButton>,
        );
      }
    },
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
          <DialogActions>
            <Button onClick={closeModal} startIcon={<VisibilityOffIcon />}>
              Hide
            </Button>
          </DialogActions>
        </>
      );
    } else if (response) {
      return response?.error ? (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', columnGap: '5px' }}>
            <Cancel sx={{ width: 25, height: 25, color: 'error.main' }} />
            Error caught
          </DialogTitle>
          <DialogContent>
            <Terminal output={response.error} />
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
            <Button
              onClick={() => {
                clearResponse();
              }}
              startIcon={<Edit />}
              color="info"
            >
              Edit
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
          <DialogTitle>Commit changes</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="branch-name"
              label="Branch name"
              type="text"
              fullWidth
              variant="outlined"
              error={isCommitingToMainBranch}
              helperText={
                isCommitingToMainBranch
                  ? 'You cannot commit directly to the main branch'
                  : undefined
              }
              value={commitBranchName}
              onChange={handleBranchNameChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CommitIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="dense"
              id="commit-message"
              label="Commit message"
              type="text"
              fullWidth
              multiline
              variant="outlined"
              value={commitMessage}
              onChange={handleCommitMessageChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ChatBubbleOutline />
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              startIcon={<SendIcon />}
              onClick={handleCommit}
              color="success"
              disabled={isCommitingToMainBranch || commitMessage === '' || commitBranchName === ''}
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
    <>
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
    </>
  );
};

export default CommitModal;

import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import { useMutation } from 'react-query';
import { useCodeChangesContext } from '@frontend/context/context';

interface Props {
  open: boolean;
  onClose: () => void;
}

const postCommitData = (data) => axios.post('http://localhost:4000/commit', data);
const useCommit = () => useMutation(postCommitData);

const CommitModal = ({ open, onClose: handleClose }: Props) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');

  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(event.target.value);
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBranchName(event.target.value);
  };

  const { mutate, isLoading, isError } = useCommit();
  const { updatedVars } = useCodeChangesContext();
  const handleCommit = () => {
    mutate({ commitMessage, branchName, updatedVars });
    handleClose();
  };

  return (
    <div>
      <Dialog open={open}>
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
            value={branchName}
            onChange={handleBranchNameChange}
          />
        </DialogContent>
        <DialogActions>
          {/*{isAmendChecked && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isNoMessageEditChecked}
                  onChange={(event) => {
                    setIsNoMessageEditChecked(event.target.checked);
                    setBranchName('');
                  }}
                  disabled={isAmendDisabled}
                />
              }
              label="no message edit"
            />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={isAmendChecked}
                onChange={(event) => setIsAmendChecked(event.target.checked)}
                disabled={isAmendDisabled}
              />
            }
            label="amend"
          />
*/}
          <Button startIcon={<SendIcon />} onClick={handleCommit} color="success">
            Commit
          </Button>
          <Button onClick={handleClose} startIcon={<CloseIcon />} color="error">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CommitModal;

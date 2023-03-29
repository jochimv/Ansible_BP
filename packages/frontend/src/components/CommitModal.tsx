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

interface Props {
  open: boolean;
  onClose: () => void;
}

const CommitModal = ({ open, onClose: handleClose }: Props) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  //const [isAmendChecked, setIsAmendChecked] = useState(false);
  //const [isAmendDisabled, setIsAmendDisabled] = useState(false);
  const [branchName, setBranchName] = useState<string>('');
  //const [isNoMessageEditChecked, setIsNoMessageEditChecked] = useState(false);

  const handleCommit = () => {
    // logic
    handleClose();
  };

  const handleCommitMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(event.target.value);
  };
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    /*if (event.target.value !== '') {
      setIsAmendDisabled(true);
      setIsAmendChecked(false);
    } else {
      setIsAmendDisabled(false);
    }*/
    setBranchName(event.target.value);
  };

  return (
    <div>
      <Dialog open={open}>
        <DialogTitle>Commit Message</DialogTitle>
        <DialogContent>
          <TextField
            //disabled={isNoMessageEditChecked}
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

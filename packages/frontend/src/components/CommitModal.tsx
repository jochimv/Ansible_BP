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
  const [isChecked, setIsChecked] = useState(false);

  const handleCommit = () => {
    // logic
    handleClose();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitMessage(event.target.value);
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
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <FormControlLabel
            control={
              <Checkbox
                checked={isChecked}
                onChange={(event) => setIsChecked(event.target.checked)}
              />
            }
            label="amend"
          />

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

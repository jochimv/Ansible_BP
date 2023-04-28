/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Snackbar } from '@mui/material';
import { Alert } from '@mui/material';
import { useCodeChangesContext } from '@frontend/context/CodeChangesContext';
import { formatErrorMessage } from '@frontend/utils';

const EditorInfoSnackbar = () => {
  const { selectedVariables } = useCodeChangesContext();

  return (
    <>
      {selectedVariables?.type === 'applied' && (
        <Snackbar open>
          <Alert severity="info">Read only</Alert>
        </Snackbar>
      )}
      {selectedVariables?.error && (
        <Snackbar open>
          <Alert severity="error">{formatErrorMessage(selectedVariables.error)}</Alert>
        </Snackbar>
      )}
    </>
  );
};

export default EditorInfoSnackbar;

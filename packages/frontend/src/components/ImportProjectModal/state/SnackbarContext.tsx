import { createContext, ReactNode, useContext, useState } from 'react';
import Snackbar from '@frontend/components/ImportProjectModal/Snackbar';
import { AlertColor } from '@mui/lab/Alert/Alert';
interface SnackbarContextType {
  showMessage: (message: string, severity: AlertColor, action?: ReactNode) => void;
  hideMessage: () => void;
}

export const SnackbarContext = createContext<SnackbarContextType>({
  showMessage: () => {},
  hideMessage: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string>('');
  const [severity, setSeverity] = useState<AlertColor>('success');
  const [action, setAction] = useState<ReactNode | undefined>();
  const showMessage = (newMessage: string, newSeverity: AlertColor, action?: ReactNode) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setAction(action);
  };

  const hideMessage = () => {
    setMessage('');
  };

  return (
    <SnackbarContext.Provider value={{ showMessage, hideMessage }}>
      {children}
      <Snackbar action={action} message={message} severity={severity} onClose={hideMessage} />
    </SnackbarContext.Provider>
  );
};

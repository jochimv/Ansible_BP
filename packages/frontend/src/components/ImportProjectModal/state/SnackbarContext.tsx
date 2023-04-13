import { createContext, useContext, useState } from 'react';
import Snackbar from '@frontend/components/ImportProjectModal/Snackbar';
import { AlertColor } from '@mui/lab/Alert/Alert';
interface SnackbarContextType {
  showMessage: (message: string, severity: AlertColor) => void;
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

  const showMessage = (newMessage: string, newSeverity: AlertColor) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
  };

  const hideMessage = () => {
    setMessage('');
  };

  return (
    <SnackbarContext.Provider value={{ showMessage, hideMessage }}>
      {children}
      <Snackbar message={message} severity={severity} onClose={hideMessage} />
    </SnackbarContext.Provider>
  );
};

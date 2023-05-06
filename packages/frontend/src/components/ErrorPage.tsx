import { Stack, Typography } from '@mui/material';
import { NOT_FOUND_ICON_SX } from '@frontend/constants';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorPageProps {
  errorMessage?: string;
}

const ErrorPage = ({ errorMessage }: ErrorPageProps) => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <ErrorOutlineIcon sx={{ ...NOT_FOUND_ICON_SX, color: 'error.main', pb: 2 }} />
    <Typography variant="h4">{errorMessage || 'Error'}</Typography>
  </Stack>
);

export default ErrorPage;

import { FolderOffOutlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

const HostNotFound = () => (
  <Stack alignItems="center" justifyContent="center" height="100%">
    <FolderOffOutlined sx={{ width: 50, height: 50 }} />
    <Typography variant="h4">Host not found</Typography>
  </Stack>
);

export default HostNotFound;

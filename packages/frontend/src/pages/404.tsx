import { Button, Stack, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useRouter } from 'next/router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Custom404() {
  const router = useRouter();

  const handleGoBack = () => router.back();
  return (
    <Stack direction="column" alignItems="center" justifyContent="center" height="100%">
      <HelpOutlineIcon sx={{ width: 50, height: 50 }} />
      <Typography variant="h3">Page not found</Typography>
      <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
        Go back
      </Button>
    </Stack>
  );
}

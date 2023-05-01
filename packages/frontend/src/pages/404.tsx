/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Custom404Page() {
  const router = useRouter();

  const handleGoBack = () => router.back();
  return (
    <Stack direction="column" alignItems="center" justifyContent="center" height="100%">
      <Typography variant="h1">404</Typography>
      <Typography variant="h3">Page not found</Typography>
      <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
        Back
      </Button>
    </Stack>
  );
}

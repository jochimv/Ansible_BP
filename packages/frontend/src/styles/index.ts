import createCache, { EmotionCache } from '@emotion/cache';
import { createTheme, Theme } from '@mui/material/styles';

export const createEmotionCache = (): EmotionCache => {
  return createCache({ key: 'css', prepend: true });
};

export const theme: Theme = createTheme();

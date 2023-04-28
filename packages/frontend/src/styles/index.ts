/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import createCache, { EmotionCache } from '@emotion/cache';
import { createTheme, Theme } from '@mui/material/styles';

export const createEmotionCache = (): EmotionCache => {
  return createCache({ key: 'css', prepend: true });
};

export const theme: Theme = createTheme();

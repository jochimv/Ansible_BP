import { createContext, useContext } from 'react';

export const EditModeContext = createContext({});
export const EditModeSetterContext = createContext({});
export const useEditModeContext = () => useContext(EditModeContext);
export const useEditModeSetterContext = () => useContext(EditModeSetterContext);

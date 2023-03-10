import { createContext, useContext } from 'react';
import { initialState } from '@frontend/pages/providers/reducer';

export const CodeChangesContext = createContext(initialState);
export const CodeChangesDispatchContext = createContext(console.log);
export const useCodeChangesContext = () => useContext(CodeChangesContext);

export const useCodeChangesDispatchContext = () => useContext(CodeChangesDispatchContext);

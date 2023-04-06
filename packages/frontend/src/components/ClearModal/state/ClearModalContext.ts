import { createContext, useContext } from 'react';
import { initialState } from './clearModalReducer';

export const ClearModalContext = createContext(initialState);
export const ClearModalDispatchContext = createContext(console.log);
export const useClearModalContext = () => useContext(ClearModalContext);

export const useClearModalDispatchContext = () => useContext(ClearModalDispatchContext);

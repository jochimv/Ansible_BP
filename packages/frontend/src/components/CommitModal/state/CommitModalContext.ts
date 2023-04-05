import { createContext, useContext } from 'react';
import { initialState } from './commitModalReducer';

export const CommitModalContext = createContext(initialState);
export const CommitModalDispatchContext = createContext(console.log);
export const useCommitModalContext = () => useContext(CommitModalContext);

export const useCommitModalDispatchContext = () => useContext(CommitModalDispatchContext);

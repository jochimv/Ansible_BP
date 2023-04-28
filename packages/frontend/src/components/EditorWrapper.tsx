/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Stack, Typography, Breadcrumbs, Box } from '@mui/material';
import Editor from '@monaco-editor/react';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { updateVariables } from '@frontend/reducers/codeChangesReducer';
import { renderBreadcrumbsSegments } from '@frontend/utils';
import { useRouter } from 'next/router';
import React from 'react';

const EditorWrapper = () => {
  const { isInEditMode, selectedVariables } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const { projectName, hostname } = useRouter().query;

  const handleEditorChange = (newEditorValue: string | undefined) => {
    dispatch(updateVariables({ newEditorValue, projectName, hostname }));
  };

  return (
    <Stack direction="column" flexGrow={1} spacing={2}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ ml: 4 }}>
        {selectedVariables?.type === 'applied' ? (
          <Typography>Applied variables</Typography>
        ) : (
          renderBreadcrumbsSegments(selectedVariables?.pathInProject)
        )}
      </Breadcrumbs>
      {selectedVariables.type === 'applied' && selectedVariables.values === '{}\n' ? (
        <Box height="100%" width="100%" alignItems="center" justifyContent="center" display="flex">
          <Typography variant="h4">No variables to show</Typography>
        </Box>
      ) : (
        <Editor
          options={{ readOnly: selectedVariables?.type === 'applied' || !isInEditMode }}
          language="yaml"
          value={selectedVariables.values}
          onChange={handleEditorChange}
        />
      )}
    </Stack>
  );
};

export default EditorWrapper;

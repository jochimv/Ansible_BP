import { Stack, Typography, Breadcrumbs } from '@mui/material';
import Editor from '@monaco-editor/react';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { updateVariables } from '@frontend/reducers/codeChangesReducer';
import { renderBreadcrumbsSegments } from '@frontend/utils';
import { useRouter } from 'next/router';

const EditorWrapper = () => {
  const { isInEditMode, selectedVariables, updatedProjects } = useCodeChangesContext();
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
      <Editor
        options={{ readOnly: selectedVariables?.type === 'applied' || !isInEditMode }}
        language="yaml"
        value={selectedVariables.values}
        onChange={handleEditorChange}
      />
    </Stack>
  );
};

export default EditorWrapper;

import { Stack, Box } from '@mui/material';
import Editor from '@monaco-editor/react';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { updateVariables } from '@frontend/reducers/codeChangesReducer';
import { renderBreadcrumbs } from '@frontend/utils';
import { useRouter } from 'next/router';

const EditorWrapper = () => {
  const { isInEditMode, selectedVariables } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const { projectName, hostname } = useRouter().query;

  const handleEditorChange = (newEditorValue: string | undefined) => {
    dispatch(updateVariables({ newEditorValue, projectName, hostname }));
  };

  return (
    <Stack direction="column" flexGrow={1} spacing={2}>
      <Box ml={4}>
        {selectedVariables?.type === 'applied'
          ? selectedVariables?.pathInProject
          : renderBreadcrumbs(selectedVariables?.pathInProject)}
      </Box>
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

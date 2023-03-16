import { DiffEditor } from '@monaco-editor/react';
import { Stack } from '@mui/material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../providers/context';
import { useEffect } from 'react';
import { createDiff } from '../providers/reducer';
import FileTree from './FileTree';

const GitPage = () => {
  const dispatch = useCodeChangesDispatchContext();
  const { oldDiff, newDiff, oldVars, newVars } = useCodeChangesContext();

  console.log(oldDiff, newDiff, oldVars, newVars);

  useEffect(() => {
    dispatch(createDiff());
  }, []);

  return (
    <Stack direction="row">
      <FileTree
        paths={[
          '\\ansible-elk\\inventories\\dev\\group_vars\\all\\common.yml',
          '\\ansible-elk\\inventories\\dev\\group_vars\\all\\hello.yml',
          '\\ansible-elk\\inventories\\dev\\host_vars\\foo.yml',
        ]}
      />
      <DiffEditor
        defaultLanguage="yml"
        original={oldDiff?.values}
        modified={newDiff?.values}
        height="500px"
        options={{ readOnly: true }}
      />
    </Stack>
  );
};

export default GitPage;

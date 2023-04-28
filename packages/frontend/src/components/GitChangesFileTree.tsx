import { SyntheticEvent, useState } from 'react';
import { TreeView } from '@mui/lab';
import { Description, Folder } from '@mui/icons-material';
import { useCodeChangesDispatchContext } from '../context/CodeChangesContext';
import { buildTree, getPathHierarchy, renderChagedFilesTree } from '@frontend/utils';

interface GitChangesFileTreeProps {
  selectedNodeId: string;
  paths: string[];
}

const GitChangesFileTree = ({ selectedNodeId, paths }: GitChangesFileTreeProps) => {
  const dispatch = useCodeChangesDispatchContext();

  const treeData = buildTree(paths);
  const allPaths = Array.from(new Set(paths?.flatMap((path: string) => getPathHierarchy(path))));
  const [expanded, setExpanded] = useState<string[]>(allPaths);
  const handleToggle = (event: SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  return (
    <TreeView
      sx={{ width: '100%' }}
      expanded={expanded}
      defaultExpanded={allPaths}
      selected={selectedNodeId}
      defaultCollapseIcon={<Folder />}
      onNodeToggle={handleToggle}
      defaultExpandIcon={<Folder />}
      defaultEndIcon={<Description />}
    >
      {renderChagedFilesTree(treeData, '', dispatch)}
    </TreeView>
  );
};

export default GitChangesFileTree;

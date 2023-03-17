import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import { Folder, Description } from '@mui/icons-material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../context/context';
import { showDiff } from '../context/reducer';

const buildTree = (paths: string[]) => {
  const tree = {};

  for (const path of paths) {
    const parts = path.split('\\').slice(1);
    let currentNode = tree;

    for (const part of parts) {
      if (!currentNode[part]) {
        currentNode[part] = {};
      }
      currentNode = currentNode[part];
    }
  }
  return tree;
};

const renderTree = (nodes, path: string, dispatch) => {
  if (Object.keys(nodes).length === 0) {
    return;
  }

  return Object.entries(nodes).map(([nodeName, children]) => {
    const newPath = `${path}\\${nodeName}`;
    const isLeaf = Object.keys(children).length === 0;

    return (
      <TreeItem
        key={newPath}
        nodeId={newPath}
        label={nodeName}
        onClick={isLeaf ? () => dispatch(showDiff(newPath)) : undefined}
        icon={isLeaf ? <Description /> : <Folder />}
      >
        {renderTree(children, newPath, dispatch)}
      </TreeItem>
    );
  });
};

const FileTree = () => {
  const { oldVars } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const paths = oldVars.map((oldVars) => oldVars.pathInProject);
  const treeData = buildTree(paths);

  return (
    <TreeView
      defaultCollapseIcon={<Folder open />}
      defaultExpandIcon={<Folder />}
      defaultEndIcon={<Description />}
    >
      {renderTree(treeData, '', dispatch)}
    </TreeView>
  );
};

export default FileTree;

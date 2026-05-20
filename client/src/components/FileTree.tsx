import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileCode, CheckSquare, Square } from 'lucide-react';

interface FileTreeProps {
  files: any[];
  selectedFiles: string[];
  onToggleFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: Record<string, TreeNode>;
}

export function FileTree({ files, selectedFiles, onToggleFile }: FileTreeProps) {
  const tree = useMemo(() => {
    const root: Record<string, TreeNode> = {};

    files.forEach((file) => {
      const parts = file.path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part: string, index: number) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'dir',
            ...(isLast ? {} : { children: {} }),
          };
        }

        if (!isLast) {
          currentLevel = currentLevel[part].children!;
        }
      });
    });

    return root;
  }, [files]);

  const renderTree = (nodes: Record<string, TreeNode>, level = 0) => {
    const sortedNodes = Object.values(nodes).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return sortedNodes.map((node) => (
      <TreeNodeItem
        key={node.path}
        node={node}
        level={level}
        selectedFiles={selectedFiles}
        onToggleFile={onToggleFile}
      />
    ));
  };

  return <div className="space-y-1">{renderTree(tree)}</div>;
}

function TreeNodeItem({
  node,
  level,
  selectedFiles,
  onToggleFile,
}: {
  node: TreeNode;
  level: number;
  selectedFiles: string[];
  onToggleFile: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedFiles.includes(node.path);

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
          style={{ paddingLeft: `${level * 16 + 8}px`, color: 'var(--color-text-primary)' }}
        >
          {expanded ? (
            <FolderOpen size={16} className="text-blue-400 opacity-80" />
          ) : (
            <Folder size={16} className="text-blue-400 opacity-80" />
          )}
          <span className="truncate text-sm">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => (
                <TreeNodeItem
                  key={child.path}
                  node={child}
                  level={level + 1}
                  selectedFiles={selectedFiles}
                  onToggleFile={onToggleFile}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onToggleFile(node.path)}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
      style={{
        paddingLeft: `${level * 16 + 8}px`,
        background: isSelected ? 'var(--color-accent-glow)' : 'transparent',
        color: isSelected ? 'var(--color-accent-start)' : 'var(--color-text-secondary)',
      }}
    >
      {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="opacity-50" />}
      <FileCode size={14} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

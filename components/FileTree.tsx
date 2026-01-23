
import React from 'react';
import { CodeFile, Severity } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown, ShieldAlert, AlertTriangle, FolderSearch } from 'lucide-react';

interface FileTreeProps {
  files: CodeFile[];
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: Record<string, TreeNode>;
  markers: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile, selectedPath }) => {
  const tree = React.useMemo(() => {
    const root: Record<string, TreeNode> = {};
    
    // First pass: build structure
    files.forEach(f => {
      const parts = f.path.split(/[/\\]/);
      let current = root;
      let currentPath = '';
      parts.forEach((part, idx) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = idx === parts.length - 1;
        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'dir',
            children: isLast ? undefined : {},
            markers: 0
          };
        }
        if (!isLast) current = current[part].children!;
      });
    });

    // Second pass: assign markers to files and propagate to parent directories
    files.forEach(f => {
      if (!f.markers || f.markers.length === 0) return;
      const count = f.markers.length;
      const parts = f.path.split(/[/\\]/);
      let current = root;
      parts.forEach((part, idx) => {
        current[part].markers += count;
        if (idx < parts.length - 1) {
          current = current[part].children!;
        }
      });
    });

    return root;
  }, [files]);

  const renderNode = (node: TreeNode, depth: number) => {
    const isSelected = selectedPath === node.path;
    const hasChildren = node.type === 'dir' && node.children && Object.keys(node.children).length > 0;
    const hasErrors = node.markers > 0;
    
    return (
      <div key={node.path} className="select-none">
        <div 
          onClick={() => node.type === 'file' && onSelectFile(node.path)}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-800/50 group relative
            ${isSelected ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400'}
            ${hasErrors && !isSelected ? 'hover:border-red-500/20' : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === 'dir' ? (
            <div className="relative">
              <Folder size={14} className={`${hasErrors ? 'text-amber-500/80' : 'text-slate-500'} shrink-0`} />
              {hasErrors && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
            </div>
          ) : (
            <div className="relative">
              {hasErrors ? (
                <ShieldAlert size={14} className="text-red-500 shrink-0 animate-pulse" />
              ) : (
                <FileCode size={14} className="text-slate-500 shrink-0" />
              )}
            </div>
          )}
          
          <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-blue-300' : hasErrors ? 'text-slate-300' : 'group-hover:text-slate-200'}`}>
            {node.name}
          </span>

          {hasErrors ? (
            <div className={`ml-auto px-1.5 py-0.5 rounded-md flex items-center gap-1 ${isSelected ? 'bg-blue-500/20' : 'bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-950/20'}`}>
              <span className={`text-[8px] font-black ${isSelected ? 'text-blue-400' : 'text-red-400'}`}>{node.markers}</span>
            </div>
          ) : null}
        </div>
        
        {hasChildren && Object.values(node.children!).sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }).map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-1 py-2">
      {Object.values(tree).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }).map(node => renderNode(node, 0))}
    </div>
  );
};

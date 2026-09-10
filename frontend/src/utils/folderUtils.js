// Helper to format flat folder array into hierarchical tree representation for dropdowns
export function getFormattedFolderList(folders) {
  if (!folders || !Array.isArray(folders)) return [];
  const map = {};
  folders.forEach(f => {
    map[f.id] = { ...f, children: [] };
  });

  const roots = [];
  folders.forEach(f => {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });

  const result = [];
  function traverse(nodes, depth = 0) {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      const indentPrefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth * 2) + '↳ 📂 ' : '📁 ';
      result.push({
        ...node,
        displayName: `${indentPrefix}${node.name}`,
        depth
      });
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  }

  traverse(roots);
  return result;
}

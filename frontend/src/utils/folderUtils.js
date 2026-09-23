// Helper to format flat folder array into hierarchical tree representation for dropdowns
export function getFormattedFolderList(folders, branchName = null) {
  if (!folders || !Array.isArray(folders)) return [];
  const map = {};
  folders.forEach(f => {
    map[f.id] = { 
      ...f, 
      children: [], 
      direct_document_count: f.document_count || 0, 
      document_count: f.document_count || 0 
    };
  });

  const roots = [];
  folders.forEach(f => {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });

  // Calculate cumulative document count rollup (sum of direct documents + all child subfolder documents)
  function calculateCumulativeCounts(node) {
    let total = node.direct_document_count || 0;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        total += calculateCumulativeCounts(child);
      }
    }
    node.document_count = total;
    return total;
  }

  roots.forEach(root => calculateCumulativeCounts(root));

  // If a specific company branch is requested (e.g. 'RAHEE' or 'IRCON'), isolate starting from that branch node
  let startingNodes = roots;
  if (branchName) {
    const targetBranchUpper = branchName.toUpperCase();
    const branchFolder = folders.find(f => (f.name || '').toUpperCase() === targetBranchUpper);
    if (branchFolder && map[branchFolder.id]) {
      startingNodes = [map[branchFolder.id]];
    }
  }

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

  traverse(startingNodes);
  return result;
}

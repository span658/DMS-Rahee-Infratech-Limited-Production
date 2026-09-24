import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import VersionHistoryModal from '../components/VersionHistoryModal';
import { 
  Search, 
  Filter, 
  Upload, 
  Eye, 
  Download, 
  History, 
  FileText, 
  Building2, 
  Plus, 
  ExternalLink,
  Lock,
  Folder,
  FolderPlus,
  X,
  Shield,
  ShieldAlert,
  Settings,
  RotateCw,
  Key,
  CheckCircle2,
  Compass,
  Trash2,
  RotateCcw,
  Archive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFormattedFolderList } from '../utils/folderUtils';

export default function Documents() {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');

  // Folder Creation Modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [parentFolderId, setParentFolderId] = useState('');
  const [isOperational, setIsOperational] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState('');

  // Folder Access Control & Settings Modal State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderOperationalState, setFolderOperationalState] = useState(false);
  const [permissionsList, setPermissionsList] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState('FULL_CONTROL');
  const [applyToSubfolders, setApplyToSubfolders] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [accessModalMessage, setAccessModalMessage] = useState('');

  // Archival Policy Manual Trigger state
  const [runningArchival, setRunningArchival] = useState(false);

  // Modals state
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState(null);
  const [historyVersions, setHistoryVersions] = useState([]);

  // STRICT RULE: Folder Creation is PERMITTED for Company Admins & Super Admin.
  const isCompanyAdmin = user?.is_super_admin || 
    [1, 2, 8].includes(user?.role_id) || 
    ['SUPER_ADMIN', 'RAHEE_ADMIN', 'IRCON_ADMIN'].includes(user?.role_name);

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders');
      if (res.data.success) {
        setFolders(res.data.folders);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter) queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      if (typeFilter) queryParams.push(`document_type=${encodeURIComponent(typeFilter)}`);
      if (selectedFolderId) queryParams.push(`folder_id=${encodeURIComponent(selectedFolderId)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`/documents${queryString}`);
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
    // Fetch system users for Access Control dropdown
    api.get('/users').then(res => {
      if (res.data.success) {
        setSystemUsers(res.data.users || []);
      }
    }).catch(err => console.warn(err));

    // Live Real-Time Polling: automatically sync folders every 5 seconds when tab is active
    const liveInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFolders();
      }
    }, 5000);

    return () => clearInterval(liveInterval);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, statusFilter, typeFilter, selectedFolderId]);

  const isIrconUser = user?.organization_id === 2 || user?.role_name === 'IRCON_ADMIN_REVIEWER' || user?.role_name === 'IRCON_ADMIN' || user?.email?.toLowerCase().startsWith('om.jha@');
  const isRaheeUser = user?.organization_id === 1 || user?.role_name === 'RAHEE_ADMIN_REVIEWER' || user?.role_name === 'RAHEE_EXEC_ADMIN' || user?.email?.toLowerCase().startsWith('rahul.d@') || user?.email?.toLowerCase().startsWith('s.mondal@');

  const myBranch = isIrconUser ? 'IRCON' : (isRaheeUser ? 'RAHEE' : '');
  const formattedFolders = user?.is_super_admin ? getFormattedFolderList(folders) : getFormattedFolderList(folders, myBranch);
  const creatableParentFolders = formattedFolders;

  useEffect(() => {
    if (showFolderModal && creatableParentFolders.length > 0) {
      if (!parentFolderId || !creatableParentFolders.some(f => f.id === parseInt(parentFolderId))) {
        setParentFolderId(String(creatableParentFolders[0].id));
      }
    }
  }, [showFolderModal, creatableParentFolders]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setFolderError('');
    if (!folderName.trim()) {
      setFolderError('Folder name is required.');
      return;
    }

    const effectiveParentId = parentFolderId || (creatableParentFolders.length > 0 ? creatableParentFolders[0].id : null);

    if (!effectiveParentId) {
      setFolderError('A parent folder selection is required for folder creation.');
      return;
    }

    try {
      setCreatingFolder(true);
      const res = await api.post('/folders', {
        name: folderName.trim(),
        description: folderDesc.trim(),
        parent_id: effectiveParentId ? parseInt(effectiveParentId) : null,
        is_operational: isOperational ? 1 : 0
      });

      setCreatingFolder(false);
      if (res.data.success) {
        setFolderName('');
        setFolderDesc('');
        setParentFolderId('');
        setIsOperational(false);
        setShowFolderModal(false);
        fetchFolders();
        if (res.data.folder) {
          setSelectedFolderId(res.data.folder.id);
        }
      }
    } catch (err) {
      setCreatingFolder(false);
      setFolderError(err.response?.data?.message || 'Failed to create folder.');
    }
  };

  const handleOpenFolderAccessControl = async (folder) => {
    setEditingFolder(folder);
    setFolderOperationalState(folder.is_operational === 1 || folder.is_operational === true);
    setAccessModalMessage('');
    setApplyToSubfolders(false);
    setSelectedTargetKey('');

    try {
      const res = await api.get(`/folders/${folder.id}/permissions`);
      if (res.data.success) {
        setPermissionsList(res.data.permissions || []);
      }
    } catch (err) {
      console.error('Failed to load folder permissions:', err);
      setPermissionsList([]);
    }

    setShowAccessModal(true);
  };

  const handleAddPermissionRule = () => {
    if (!selectedTargetKey) return;
    const parts = selectedTargetKey.split(':');
    const type = parts[0];
    const targetId = parseInt(parts[1]);

    if (type === 'role') {
      if (permissionsList.some(p => p.role_id === targetId)) {
        setAccessModalMessage('Permission rule for this role already exists in table.');
        return;
      }
      const roleNameMap = {
        1: 'SUPER_ADMIN',
        2: 'RAHEE_ADMIN',
        6: 'MANAGER_OVERSIGHT',
        7: 'DOCUMENT_UPLOADER',
        8: 'IRCON_ADMIN'
      };

      const newRule = {
        folder_id: editingFolder.id,
        role_id: targetId,
        user_id: null,
        role_name: roleNameMap[targetId] || `Role #${targetId}`,
        user_name: null,
        permission_level: selectedPermissionLevel
      };
      setPermissionsList([...permissionsList, newRule]);
    } else if (type === 'user') {
      if (permissionsList.some(p => p.user_id === targetId)) {
        setAccessModalMessage('Permission rule for this user account already exists in table.');
        return;
      }
      const u = systemUsers.find(userObj => userObj.id === targetId);
      const newRule = {
        folder_id: editingFolder.id,
        role_id: null,
        user_id: targetId,
        role_name: null,
        user_name: u ? `${u.name} (${u.email})` : `User #${targetId}`,
        permission_level: selectedPermissionLevel
      };
      setPermissionsList([...permissionsList, newRule]);
    }

    setSelectedTargetKey('');
    setAccessModalMessage('');
  };

  const handleRemovePermissionRule = (index) => {
    const updated = [...permissionsList];
    updated.splice(index, 1);
    setPermissionsList(updated);
  };

  const handleSaveFolderSettingsAndPermissions = async (e) => {
    e.preventDefault();
    if (!editingFolder) return;
    setSavingPermissions(true);
    setAccessModalMessage('');

    try {
      // 1. Update operational folder non-archival setting
      await api.put(`/folders/${editingFolder.id}`, {
        name: editingFolder.name,
        description: editingFolder.description,
        parent_id: editingFolder.parent_id,
        is_operational: folderOperationalState ? 1 : 0
      });

      // 2. Update folder access control permissions
      await api.post(`/folders/${editingFolder.id}/permissions`, {
        permissions: permissionsList,
        apply_to_subfolders: applyToSubfolders
      });

      setSavingPermissions(false);
      setShowAccessModal(false);
      fetchFolders();
      alert(`Folder '${editingFolder.name}' settings and access control permissions updated successfully.`);
    } catch (err) {
      setSavingPermissions(false);
      setAccessModalMessage(err.response?.data?.message || 'Failed to update folder settings.');
    }
  };

  const handleRunArchivalPolicy = async () => {
    const scopeMessage = selectedFolderId ? 'all active documents in the currently selected folder' : 'all active documents across the repository';
    if (!window.confirm(`Execute Bikramshila Manual Document Archival Policy now? This will move ${scopeMessage} to Archive.`)) {
      return;
    }

    try {
      setRunningArchival(true);
      const res = await api.post('/documents/run-archival-policy', {
        folder_id: selectedFolderId || null
      });
      setRunningArchival(false);
      if (res.data.success) {
        alert(`Bikramshila Manual Document Archival Policy Executed Successfully!\n\nDocuments Archived: ${res.data.archivedCount}\n${res.data.archivedDocTitles?.length > 0 ? `Archived Files:\n- ${res.data.archivedDocTitles.join('\n- ')}` : 'No active documents were found to archive.'}`);
        fetchDocuments();
      }
    } catch (err) {
      setRunningArchival(false);
      alert('Failed to execute archival policy: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownload = async (doc, versionId) => {
    try {
      const baseVersionQuery = versionId ? `?version_id=${versionId}` : '';
      const res = await api.get(`/documents/${doc.id}/download${baseVersionQuery}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      
      let fileName = doc.original_filename || doc.title || 'document';
      const contentDisposition = res.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) fileName = match[1];
      }
      
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document file. Please try again.');
    }
  };

  const handleOpenVersionHistory = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}`);
      if (res.data.success) {
        setSelectedHistoryDoc(doc);
        setHistoryVersions(res.data.versions);
      }
    } catch (err) {
      alert('Failed to load version history: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!user?.is_super_admin) {
      alert('Forbidden: ONLY Super Admin is authorized to delete documents.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete document "${doc.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/documents/${doc.id}`);
      if (res.data.success) {
        alert(`Document "${doc.title}" deleted successfully.`);
        fetchDocuments();
        fetchFolders();
      }
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!user?.is_super_admin) {
      alert('Forbidden: ONLY Super Admin is authorized to delete folders.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete folder "${folder.name}"? Documents inside will be unlinked.`)) {
      return;
    }
    try {
      const res = await api.delete(`/folders/${folder.id}`);
      if (res.data.success) {
        alert(`Folder "${folder.name}" deleted successfully.`);
        setShowAccessModal(false);
        fetchFolders();
        fetchDocuments();
      }
    } catch (err) {
      alert('Failed to delete folder: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleArchiveDocument = async (doc) => {
    if (!window.confirm(`Are you sure you want to move document "${doc.title}" to Archive?`)) {
      return;
    }
    try {
      const res = await api.post(`/documents/${doc.id}/archive`);
      if (res.data.success) {
        alert(res.data.message);
        fetchDocuments();
        fetchFolders();
      }
    } catch (err) {
      alert('Failed to archive document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestoreDocument = async (doc) => {
    if (!window.confirm(`Restore archived document "${doc.title}" back into active Bikramshila folder hierarchy?`)) {
      return;
    }
    try {
      const res = await api.post(`/documents/${doc.id}/restore`);
      if (res.data.success) {
        alert(res.data.message);
        fetchDocuments();
        fetchFolders();
      }
    } catch (err) {
      alert('Failed to restore document: ' + (err.response?.data?.message || err.message));
    }
  };

  const currentSelectedFolderObj = folders.find(f => f.id === parseInt(selectedFolderId));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Central Document Repository</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access secure document storage, CAD drawings, version history, and folder access control permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user?.is_super_admin && (
            <button
              onClick={handleRunArchivalPolicy}
              disabled={runningArchival}
              title="Manually trigger Bikramshila Manual Document Archival Policy check (Super Admin Only)"
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 ${runningArchival ? 'animate-spin' : ''}`} />
              <span>Bikramshila Manual Archival Policy</span>
            </button>
          )}

          {isCompanyAdmin && (
            <>

              <button
                onClick={() => setShowFolderModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Folder</span>
              </button>
            </>
          )}

          {!user?.is_super_admin && (isCompanyAdmin || hasPermission('upload')) && (
            <Link
              to="/documents/upload"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Document</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters & Folder Management Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title or description..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Folder Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-bold"
          >
            <option value="">📁 All Folders ({formattedFolders.reduce((acc, f) => acc + (f.direct_document_count || 0), 0)})</option>
            {formattedFolders.map(f => (
              <option key={f.id} value={f.id}>
                {f.displayName} ({f.document_count || 0}) {f.is_operational ? '🛡️ [Operational]' : ''}
              </option>
            ))}
          </select>

          {user?.is_super_admin && currentSelectedFolderObj && (
            <button
              onClick={() => handleOpenFolderAccessControl(currentSelectedFolderObj)}
              title="Manage Folder Settings & Access Control Permissions (Super Admin Only)"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition flex items-center space-x-1 text-xs font-semibold shrink-0"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Access Control</span>
            </button>
          )}
        </div>

        {/* Document Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-medium"
        >
          <option value="">All Document Types</option>
          <option value="PDF">📄 PDF Document</option>
          <option value="WORD">📝 Microsoft Word</option>
          <option value="EXCEL">📊 Microsoft Excel</option>
          <option value="POWERPOINT">📊 Microsoft PowerPoint</option>
          <option value="IMAGE">🖼️ Image</option>
          <option value="CAD">📐 CAD Drawing / 3D Model</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="FINAL_APPROVED">Active Documents</option>
          <option value="ARCHIVED">📦 Archived Documents</option>
        </select>
      </div>



      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            Loading document repository...
          </div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document Title & Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Folder / Category</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    
                    <td className="py-3.5 px-4">
                      <div>
                        <Link to={`/documents/${doc.id}`} className="font-bold text-slate-900 hover:text-blue-600 text-sm line-clamp-1">
                          {doc.title}
                        </Link>
                        {doc.description && (
                          <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{doc.description}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        doc.document_type === 'CAD' ? 'bg-teal-100 text-teal-800' :
                        doc.document_type === 'PDF' ? 'bg-rose-100 text-rose-800' :
                        doc.document_type === 'WORD' ? 'bg-blue-100 text-blue-800' :
                        doc.document_type === 'EXCEL' ? 'bg-emerald-100 text-emerald-800' :
                        doc.document_type === 'POWERPOINT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {doc.document_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{doc.folder_name || 'Uncategorized'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {doc.current_version_number || 'V1'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{doc.uploader_name}</div>
                      <div className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        
                        <button
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Preview Document Stream"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenVersionHistory(doc)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="View Version History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Download Document File"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Open Details & Review Trail"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {doc.status !== 'ARCHIVED' && user?.is_super_admin && (
                          <button
                            onClick={() => handleArchiveDocument(doc)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                            title="Move Document to Archive (Super Admin Only)"
                          >
                            <Archive className="w-4 h-4 text-amber-600" />
                          </button>
                        )}

                        {doc.status === 'ARCHIVED' && user?.is_super_admin && (
                          <button
                            onClick={() => handleRestoreDocument(doc)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Restore Document back to Active Hierarchy (Super Admin Only)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {user?.is_super_admin && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Document (Super Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">No Documents Found</p>
            <p className="mt-1">No documents match your active tenant scope or search filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={!!selectedPreviewDoc}
        onClose={() => setSelectedPreviewDoc(null)}
        document={selectedPreviewDoc}
        onDownload={handleDownload}
      />

      <VersionHistoryModal
        isOpen={!!selectedHistoryDoc}
        onClose={() => setSelectedHistoryDoc(null)}
        versions={historyVersions}
        documentTitle={selectedHistoryDoc?.title}
        onDownloadVersion={(ver) => handleDownload(selectedHistoryDoc, ver.id)}
      />

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <span>Create New Tenant Folder</span>
              </div>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {folderError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
                {folderError}
              </div>
            )}

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent Folder
                </label>
                <select
                  value={parentFolderId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setParentFolderId(selId);
                    if (selId) {
                      const pObj = folders.find(f => f.id === parseInt(selId));
                      if (pObj && (pObj.is_operational === 1 || pObj.is_operational === true)) {
                        setIsOperational(true);
                      }
                    }
                  }}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-900"
                >
                  {creatableParentFolders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.displayName} {f.is_operational ? '🛡️ (Operational)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Folder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Financial Audits 2026 or Operational Docs"
                  required
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Folder Description
                </label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="Optional description or context..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>



              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {creatingFolder ? 'Creating Folder...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Folder Access Control & Operational Settings Modal */}
      {showAccessModal && editingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-black text-base">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Folder Access Control & Settings — {editingFolder.name}</span>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {accessModalMessage && (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
                {accessModalMessage}
              </div>
            )}

            <form onSubmit={handleSaveFolderSettingsAndPermissions} className="space-y-5">
              


              {/* Section 2: Admin Access Control Permission Settings for Folders & Subfolders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <span>Role & User Access Control Permissions</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Admin Configurable</span>
                </div>

                {/* Add Rule Input Row */}
                <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <select
                    value={selectedTargetKey}
                    onChange={(e) => setSelectedTargetKey(e.target.value)}
                    className="flex-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">Select Role or User Account to Assign Access...</option>
                    <optgroup label="System Roles">
                      <option value="role:1">SUPER_ADMIN (Super Admin - Rajib Ghosh)</option>
                      <option value="role:2">RAHEE_ADMIN (Rahee Admin - Rahul Dey)</option>
                      <option value="role:7">DOCUMENT_UPLOADER (Execution Control - Somnath Mondal)</option>
                      <option value="role:8">IRCON_ADMIN (Ircon Admin - Om Jha)</option>
                      <option value="role:6">MANAGER_OVERSIGHT (Managers & Viewers)</option>
                    </optgroup>
                    {systemUsers && systemUsers.length > 0 && (
                      <optgroup label="Individual User Accounts">
                        {systemUsers.map((u) => (
                          <option key={u.id} value={`user:${u.id}`}>
                            👤 {u.name} ({u.email}) — [{u.role_name || u.role}]
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <select
                    value={selectedPermissionLevel}
                    onChange={(e) => setSelectedPermissionLevel(e.target.value)}
                    className="p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold"
                  >
                    <option value="FULL_CONTROL">Full Control (View, Upload, Manage)</option>
                    <option value="WRITE">Write / Upload Access</option>
                    <option value="READ">Read / View Only</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddPermissionRule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shrink-0"
                  >
                    Add Rule
                  </button>
                </div>

                {/* Active Permission Rules List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Target Role / User Account</th>
                        <th className="py-2.5 px-3">Access Control Level</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {permissionsList.length > 0 ? (
                        permissionsList.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              {p.user_id ? (
                                <span className="flex items-center space-x-1.5 text-indigo-700">
                                  <span>👤</span>
                                  <span>{p.user_name ? `${p.user_name}` : `User ID #${p.user_id}`}</span>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-1.5 text-slate-800">
                                  <span>🛡️</span>
                                  <span>{p.role_name || `Role ID #${p.role_id}`}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                {p.permission_level}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemovePermissionRule(idx)}
                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-slate-400 italic">
                            No custom role or user access rules added. Default organization RBAC permissions apply.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Checkbox: Apply to all subfolders */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToSubfolders}
                    onChange={(e) => setApplyToSubfolders(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-950">
                    Apply these access control permissions recursively to all child subfolders
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  {user?.is_super_admin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(editingFolder)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Folder</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAccessModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPermissions}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    {savingPermissions ? 'Saving Settings...' : 'Save Settings & Permissions'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

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
  X
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
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState('');

  // Modals state
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);
  const [selectedHistoryDoc, setSelectedHistoryDoc] = useState(null);
  const [historyVersions, setHistoryVersions] = useState([]);

  // STRICT RULE: Folder Creation is EXCLUSIVELY PERMITTED for Company Admins (Rahul Dey, Rajib Ghosh, Shardu Kumar Rastogi) & Super Admin ONLY.
  const isCompanyAdmin = user?.is_super_admin || 
    [1, 2, 3, 8].includes(user?.role_id) || 
    ['SUPER_ADMIN', 'RAHEE_ADMIN_REVIEWER', 'RAHEE_EXEC_ADMIN', 'IRCON_ADMIN_REVIEWER'].includes(user?.role_name);

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
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, statusFilter, typeFilter, selectedFolderId]);

  const formattedFolders = getFormattedFolderList(folders);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setFolderError('');
    if (!folderName.trim()) {
      setFolderError('Folder name is required.');
      return;
    }

    try {
      setCreatingFolder(true);
      const res = await api.post('/folders', {
        name: folderName.trim(),
        description: folderDesc.trim(),
        parent_id: parentFolderId || null
      });

      setCreatingFolder(false);
      if (res.data.success) {
        setFolderName('');
        setFolderDesc('');
        setParentFolderId('');
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Central Document Repository</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access secure document storage, version history, and review workflows under tenant isolation.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isCompanyAdmin && (
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Folder</span>
            </button>
          )}

          {!user?.is_super_admin && (hasPermission('upload') || hasPermission('DOCUMENT_UPLOAD')) && (
            <Link
              to="/documents/upload"
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Document</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        
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
        <select
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-bold"
        >
          <option value="">📁 All Folders ({folders.reduce((acc, f) => acc + (f.document_count || 0), 0)})</option>
          <option value="uncategorized">📄 Uncategorized Documents</option>
          {formattedFolders.map(f => (
            <option key={f.id} value={f.id}>
              {f.displayName} ({f.document_count || 0})
            </option>
          ))}
        </select>

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
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_REVIEW_1">Pending Stage 1 Review</option>
          <option value="PENDING_REVIEW_2">Pending Stage 2 Review</option>
          <option value="FINAL_APPROVAL_PENDING">Pending Final Approval</option>
          <option value="FINAL_APPROVED">Final Approved & Locked</option>
          <option value="REJECTED">Changes Requested (Rejected)</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading document repository...
          </div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Tenant Org</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <Link to={`/documents/${doc.id}`} className="font-bold text-slate-900 hover:text-blue-600 transition line-clamp-1">
                            {doc.title}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.document_type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{doc.organization_name || 'Organization'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-700">
                      {doc.current_version_number || 'V1'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-900">{doc.uploader_name}</p>
                      <p className="text-[10px] text-slate-400">{doc.uploader_email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        
                        <button
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenVersionHistory(doc)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="View Version History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {doc.status === 'FINAL_APPROVED' || doc.is_locked === 1 ? (
                          <button
                            disabled
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                            title="Download disabled for Final Approved document"
                          >
                            <Lock className="w-4 h-4 text-slate-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Open Details & Review Trail"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

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
                  Main Folder (Select to create Subfolder)
                </label>
                <select
                  value={parentFolderId}
                  onChange={(e) => setParentFolderId(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-900"
                >
                  <option value="">📁 None (Create as Main Folder)</option>
                  {formattedFolders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.displayName}
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
                  placeholder="e.g., Financial Audits 2026"
                  required
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Folder Description / Category Context
                </label>
                <input
                  type="text"
                  value={folderDesc}
                  onChange={(e) => setFolderDesc(e.target.value)}
                  placeholder="Optional description or category context..."
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

    </div>
  );
}

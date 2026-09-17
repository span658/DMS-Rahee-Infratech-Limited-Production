import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import WorkflowStepper from '../components/WorkflowStepper';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import VersionHistoryModal from '../components/VersionHistoryModal';
import ReviewActionModal from '../components/ReviewActionModal';
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  History, 
  FileText, 
  MessageSquare, 
  Upload, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Clock, 
  User,
  Trash2,
  Archive,
  RotateCcw
} from 'lucide-react';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Revision upload & Archival state
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState('');
  const [archivingDoc, setArchivingDoc] = useState(false);

  // Modals & Restoration state
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [restoringDoc, setRestoringDoc] = useState(false);
  const [workflowEnabled, setWorkflowEnabled] = useState(true);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setDocument(res.data.document);
        setVersions(res.data.versions);
        setReviews(res.data.reviews);
        if (res.data.workflow_enabled !== undefined) {
          setWorkflowEnabled(res.data.workflow_enabled);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, [id]);

  const handleDownload = async (docObj, versionId) => {
    try {
      const targetDoc = docObj || document;
      const baseVersionQuery = versionId ? `?version_id=${versionId}` : '';
      const res = await api.get(`/documents/${targetDoc.id}/download${baseVersionQuery}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      
      let fileName = targetDoc.original_filename || targetDoc.title || 'document';
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

  const getRevisionAcceptString = (type) => {
    switch (type) {
      case 'PDF':
        return '.pdf';
      case 'WORD':
        return '.doc,.docx';
      case 'EXCEL':
        return '.xls,.xlsx';
      case 'POWERPOINT':
        return '.ppt,.pptx';
      case 'IMAGE':
        return '.jpg,.jpeg,.png,.webp,.svg';
      case 'CAD':
        return '.dwg,.dxf,.stl,.obj,.step,.stp,.iges';
      default:
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.stl,.obj,.step,.stp,.iges';
    }
  };

  const handleRevisionFileChange = (fileObj) => {
    setRevisionFile(fileObj);
    if (fileObj && !revisionNotes) {
      const rawName = fileObj.name;
      const lastDotIndex = rawName.lastIndexOf('.');
      const cleanName = lastDotIndex !== -1 ? rawName.slice(0, lastDotIndex).replace(/_/g, ' ') : rawName;
      setRevisionNotes(`Updated revision file: ${cleanName}`);
    }
  };

  const handleRevisionUpload = async (e) => {
    e.preventDefault();
    setRevisionError('');
    if (!revisionFile) {
      setRevisionError('Please select a revised file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', revisionFile);
    formData.append('change_description', revisionNotes.trim());

    try {
      setUploadingRevision(true);
      const res = await api.post(`/documents/${id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadingRevision(false);
      setRevisionFile(null);
      setRevisionNotes('');
      if (res.data.success) {
        fetchDocumentData();
      }
    } catch (err) {
      setUploadingRevision(false);
      setRevisionError(err.response?.data?.message || 'Failed to upload revised document version.');
    }
  };

  const handleSubmitReview = async ({ action, comments }) => {
    await api.post(`/documents/${id}/review`, { action, comments });
    fetchDocumentData();
  };

  const handleRestoreDocument = async () => {
    try {
      setRestoringDoc(true);
      const res = await api.post(`/documents/${id}/restore`);
      setRestoringDoc(false);
      if (res.data.success) {
        alert(res.data.message);
        fetchDocumentData();
      }
    } catch (err) {
      setRestoringDoc(false);
      alert('Failed to restore document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleArchiveDocument = async () => {
    if (!window.confirm(`Are you sure you want to move document "${document?.title}" to Archive?`)) {
      return;
    }
    try {
      setArchivingDoc(true);
      const res = await api.post(`/documents/${id}/archive`);
      setArchivingDoc(false);
      if (res.data.success) {
        alert(res.data.message);
        fetchDocumentData();
      }
    } catch (err) {
      setArchivingDoc(false);
      alert('Failed to archive document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDocument = async () => {
    if (!user?.is_super_admin) {
      alert('Forbidden: ONLY Super Admin is authorized to delete documents.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete document "${document?.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data.success) {
        alert(`Document "${document?.title}" deleted successfully.`);
        navigate('/documents');
      }
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Document Access Error</h2>
        <p className="text-xs text-slate-500 mt-1">The requested document was not found or access is restricted under tenant isolation.</p>
        <Link to="/documents" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Return to Repository
        </Link>
      </div>
    );
  }

  // Can current user review this document?
  const isReviewer1 = ['RAHEE_ADMIN_REVIEWER', 'IRCON_ADMIN_REVIEWER', 'REVIEWER_1'].includes(user?.role_name);
  const isReviewer2 = ['STEP2_REVIEWER', 'REVIEWER_2'].includes(user?.role_name);
  const isFinalApprover = user?.role_name === 'FINAL_APPROVER' || hasPermission('final_approve');

  let canReview = false;
  if (isReviewer1) {
    canReview = document.status === 'PENDING_REVIEW_1';
  } else if (isReviewer2) {
    canReview = ['PENDING_REVIEW_1', 'PENDING_REVIEW_2', 'APPROVED_BY_REVIEWER_1'].includes(document.status);
  } else if (user?.is_super_admin) {
    canReview = ['PENDING_REVIEW_1', 'PENDING_REVIEW_2', 'APPROVED_BY_REVIEWER_1'].includes(document.status);
  }

  const canFinalApprove = (isFinalApprover || user?.is_super_admin) && ['FINAL_APPROVAL_PENDING', 'APPROVED_BY_REVIEWER_2'].includes(document.status);
  const canRequestRevisionOnApproved = (isReviewer1 || isReviewer2 || isFinalApprover || user?.is_super_admin) && (document.status === 'FINAL_APPROVED' || document.is_locked === 1);

  const isUserAllowedToReview = canReview || canFinalApprove || canRequestRevisionOnApproved;
  const isOriginalUploader = document.uploaded_by === user?.id;
  const isRejectedAndUploader = document.status === 'REJECTED' && !user?.is_super_admin && isOriginalUploader;
  const isFinalApprovedAndUploader = (document.status === 'FINAL_APPROVED' || document.is_locked === 1) && !user?.is_super_admin && isOriginalUploader;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link to="/documents" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{document.title}</h1>
              <StatusBadge status={document.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type: <strong>{document.document_type}</strong> &bull; Tenant: <strong>{document.organization_name}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition border border-blue-200"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Document</span>
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition border border-emerald-200"
          >
            <History className="w-4 h-4" />
            <span>Version History ({versions.length})</span>
          </button>

          <button
            onClick={() => handleDownload(document)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download {document.current_version_number || 'V1'}</span>
          </button>

          {user?.is_super_admin && document.status !== 'ARCHIVED' && (
            <button
              onClick={handleArchiveDocument}
              disabled={archivingDoc}
              className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition border border-amber-300"
              title="Archive Document (Super Admin Only)"
            >
              <Archive className="w-4 h-4 text-amber-600" />
              <span>{archivingDoc ? 'Archiving...' : 'Archive Document'}</span>
            </button>
          )}

          {user?.is_super_admin && document.status === 'ARCHIVED' && (
            <button
              onClick={handleRestoreDocument}
              disabled={restoringDoc}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition border border-emerald-300"
              title="Restore Document (Super Admin Only)"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>{restoringDoc ? 'Restoring...' : 'Restore Document'}</span>
            </button>
          )}

          {user?.is_super_admin && (
            <button
              onClick={handleDeleteDocument}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
              title="Delete Document (Super Admin Only)"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Workflow Progress Stepper (Only rendered if workflow is active) */}
      {workflowEnabled && (
        <WorkflowStepper status={document.status} currentVersion={document.current_version_number} />
      )}

      {/* Review Action Banner for Eligible Reviewers (Only rendered if workflow is active) */}
      {workflowEnabled && isUserAllowedToReview && (
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white shadow-lg flex flex-col justify-between gap-4 border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase tracking-wider">
                {document.status === 'FINAL_APPROVED' ? 'Request Revisions' : 'Action Required'}
              </span>
              <h3 className="text-lg font-extrabold mt-1">
                {document.status === 'FINAL_APPROVED' ? 'Request Changes on Approved Document' : 'Pending Your Workflow Review'}
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                {document.status === 'FINAL_APPROVED' 
                  ? 'This document is Final Approved. If further edits are required, click below to submit change requests in description box.'
                  : 'Review document details, preview contents, check past history, and submit your decision.'}
              </p>
            </div>

            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition shrink-0"
            >
              {document.status === 'FINAL_APPROVED' ? 'Request Changes / Revision &rarr;' : 'Submit Review Decision &rarr;'}
            </button>
          </div>

          {/* Reviewer 1 Stage 1 Note / Feedback for Reviewer 2 */}
          {document.status === 'PENDING_REVIEW_2' && reviews.filter(r => r.reviewer_role === 'REVIEWER_1' || r.reviewer_role === 'RAHEE_ADMIN_REVIEWER').slice(-1)[0] && (
            <div className="p-3 bg-blue-950/70 border border-blue-700/80 rounded-xl text-xs text-blue-100 mt-1">
              <span className="font-bold text-amber-300">
                💬 Stage 1 Review Note from {reviews.filter(r => r.reviewer_role === 'REVIEWER_1' || r.reviewer_role === 'RAHEE_ADMIN_REVIEWER').slice(-1)[0].reviewer_name} ({reviews.filter(r => r.reviewer_role === 'REVIEWER_1' || r.reviewer_role === 'RAHEE_ADMIN_REVIEWER').slice(-1)[0].action}):
              </span>
              <p className="mt-1 italic text-white font-medium bg-blue-900/50 p-2 rounded-lg border border-blue-800">
                "{reviews.filter(r => r.reviewer_role === 'REVIEWER_1' || r.reviewer_role === 'RAHEE_ADMIN_REVIEWER').slice(-1)[0].comments}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Restoration Banner for Archived Documents */}
      {document.status === 'ARCHIVED' && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 w-full">
              <h3 className="font-bold text-amber-950 text-sm">Archived Document</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                This document is currently archived. File binaries and records are permanently retained in storage and remain previewable, downloadable, and restorable.
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleRestoreDocument}
              disabled={restoringDoc}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-2"
            >
              <span>{restoringDoc ? 'Restoring Document...' : 'Restore Document & Resubmit for Review'}</span>
            </button>
          </div>
        </div>
      )}





      {/* Main Metadata & Review Trail Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Overview & Review Trail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Document Information</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {document.description || 'No description provided.'}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Uploaded By:</span>
                <span className="font-bold text-slate-800">{document.uploader_name}</span>
                <span className="text-slate-500 block text-[10px]">{document.uploader_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[11px]">Upload Timestamp:</span>
                <span className="font-bold text-slate-800">{new Date(document.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Review Trail & Comment History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Workflow Review Trail & Comments</span>
              <span className="text-xs font-normal text-slate-400">{reviews.length} Review Entries</span>
            </h3>

            <div className="space-y-3">
              {reviews && reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      rev.action === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          rev.action === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {rev.action}
                        </span>
                        <span className="font-bold text-slate-900">{rev.reviewer_name}</span>
                        <span className="text-slate-500 text-[11px]">({rev.reviewer_role})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(rev.created_at).toLocaleString()}</span>
                    </div>

                    <p className="text-slate-800 font-medium pl-1 italic">
                      "{rev.comments}"
                    </p>
                    <p className="text-[10px] text-slate-400 pl-1">Reviewed Version: {rev.version_number || 'V1'}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No reviews recorded yet for this document.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Col: Version List Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>All Versions ({versions.length})</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">Immutable</span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {versions.map((ver) => (
                <div key={ver.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">{ver.version_number}</span>
                    {document.status === 'FINAL_APPROVED' || document.is_locked === 1 ? (
                      <span className="text-[10px] text-slate-400 font-bold italic flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-slate-400 inline" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownload(document, ver.id)}
                        className="text-[11px] text-blue-600 hover:underline font-bold"
                      >
                        Download
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 truncate">{ver.original_filename}</p>
                  <p className="text-[10px] text-slate-400 italic truncate">{ver.change_description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={document}
        onDownload={handleDownload}
      />

      <VersionHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        versions={versions}
        documentTitle={document.title}
        onDownloadVersion={(ver) => handleDownload(document, ver.id)}
      />

      <ReviewActionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        document={document}
        onSubmitReview={handleSubmitReview}
      />

    </div>
  );
}

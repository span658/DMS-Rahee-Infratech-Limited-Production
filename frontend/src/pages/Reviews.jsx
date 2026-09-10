import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { CheckSquare, ExternalLink, FileText, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reviews() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        setLoading(true);
        let targetStatus = '';
        if (['RAHEE_ADMIN_REVIEWER', 'IRCON_ADMIN_REVIEWER', 'REVIEWER_1'].includes(user?.role_name)) {
          targetStatus = 'PENDING_REVIEW_1';
        } else if (['STEP2_REVIEWER', 'REVIEWER_2'].includes(user?.role_name)) {
          targetStatus = 'PENDING_REVIEW_1,PENDING_REVIEW_2,APPROVED_BY_REVIEWER_1';
        } else if (user?.role_name === 'FINAL_APPROVER') {
          targetStatus = 'FINAL_APPROVAL_PENDING';
        }

        const queryString = targetStatus ? `?status=${targetStatus}` : '';
        const res = await api.get(`/documents${queryString}`);

        if (res.data.success) {
          setDocuments(res.data.documents);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchPendingReviews();
  }, [user]);

  const getRoleDisplayName = (roleName) => {
    if (!roleName) return '';
    if (['RAHEE_ADMIN_REVIEWER', 'IRCON_ADMIN_REVIEWER', 'REVIEWER_1'].includes(roleName)) return 'Reviewer 1';
    if (['STEP2_REVIEWER', 'REVIEWER_2'].includes(roleName)) return 'Reviewer 2';
    if (roleName === 'FINAL_APPROVER') return 'Final Approver';
    return roleName;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workflow Reviews Inbox</h1>
        <p className="text-xs text-slate-500 mt-1">
          Documents requiring your review decision under your active role (<strong className="text-blue-600">{getRoleDisplayName(user?.role_name)}</strong>).
        </p>
      </div>

      {/* Review List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading review queue...
          </div>
        ) : documents.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link to={`/documents/${doc.id}`} className="font-bold text-slate-900 text-sm hover:text-blue-600 transition">
                        {doc.title}
                      </Link>
                      <span className="font-bold text-blue-600 text-xs">{doc.current_version_number || 'V1'}</span>
                      <StatusBadge status={doc.status} />
                    </div>

                    <p className="text-xs text-slate-600 mt-1 italic">{doc.description || 'No description'}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-2">
                      <span>Uploaded by: <strong className="text-slate-700">{doc.uploader_name}</strong></span>
                      <span>Tenant: <strong className="text-slate-700">{doc.organization_name}</strong></span>
                      <span>Date: {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/documents/${doc.id}`}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Review Document &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CheckSquare className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-sm">Review Inbox Clear</p>
            <p className="mt-1">There are no pending documents awaiting your review action at this time.</p>
          </div>
        )}
      </div>

    </div>
  );
}

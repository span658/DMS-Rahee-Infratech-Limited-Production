import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

export default function ReviewActionModal({ isOpen, onClose, document, onSubmitReview }) {
  const [action, setAction] = useState('APPROVED');
  const [comments, setComments] = useState('OK');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !document) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (action === 'REJECTED' && (!comments || comments.trim() === '' || comments.trim() === 'OK')) {
      setError('Please provide detailed instructions or reasons for requested changes.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitReview({ action, comments: comments.trim() });
      setSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Failed to submit review decision.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Submit Workflow Review Decision</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
            <p className="font-bold text-slate-900 text-sm mb-1">{document.title}</p>
            <p>Version: <span className="font-semibold text-blue-600">{document.current_version_number || 'V1'}</span> | Current Status: <span className="font-semibold">{document.status}</span></p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Review Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAction('APPROVED');
                  if (comments === '' || comments.includes('Required Changes')) setComments('OK');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                  action === 'APPROVED'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>APPROVE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAction('REJECTED');
                  if (comments === 'OK') setComments('Required Changes:\n1. \n2. ');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition ${
                  action === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>REJECT (Request Changes)</span>
              </button>
            </div>
          </div>

          {/* Comments Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {action === 'REJECTED' ? 'Required Changes & Rejection Reason (Mandatory)' : 'Reviewer Comments / Approval Notes'}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={action === 'REJECTED' ? 'Specify page numbers, section updates, or required corrections...' : 'Enter approval notes (e.g., OK)...'}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-sm transition ${
                action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? 'Submitting...' : `Submit ${action === 'APPROVED' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

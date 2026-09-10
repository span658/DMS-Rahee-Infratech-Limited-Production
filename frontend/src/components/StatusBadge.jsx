import React from 'react';

const statusConfig = {
  PENDING_REVIEW_1: { label: 'Pending Stage 1 Review', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  APPROVED_BY_REVIEWER_1: { label: 'Approved by Stage 1', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  PENDING_REVIEW_2: { label: 'Pending Stage 2 Review', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  APPROVED_BY_REVIEWER_2: { label: 'Approved by Stage 2', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  FINAL_APPROVAL_PENDING: { label: 'Pending Final Approval', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  FINAL_APPROVED: { label: 'Final Approved & Locked', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  REJECTED: { label: 'Changes Requested (Rejected)', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace('text-', 'bg-')}`}></span>
      {config.label}
    </span>
  );
}

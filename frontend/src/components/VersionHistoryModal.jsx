import React from 'react';
import { X, History, Download, FileCheck, Calendar, User, Lock } from 'lucide-react';

export default function VersionHistoryModal({ isOpen, onClose, versions, documentTitle, onDownloadVersion }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-bold text-base">Complete Document Version History</h2>
              <p className="text-xs text-slate-300">Document: <span className="text-emerald-300 font-semibold">{documentTitle}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-slate-500 italic">
            🔒 System Audit Rule: All previous versions remain permanently stored and immutable. Uploading a new version will never overwrite earlier versions.
          </p>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {versions && versions.length > 0 ? (
              versions.map((ver, index) => {
                const isLockedVersion = ver.review_status === 'FINAL_APPROVED' || ver.version_number?.toUpperCase().includes('FINAL');
                return (
                  <div key={ver.id || index} className="p-4 bg-white hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md text-xs border border-emerald-300">
                          {ver.version_number}
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">{ver.original_filename}</span>
                        <span className="text-xs text-slate-400">({(ver.file_size / 1024).toFixed(1)} KB)</span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium pt-1">
                        💬 <span className="italic">{ver.change_description || 'No revision notes'}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Uploaded by {ver.uploader_name || 'User'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(ver.created_at).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-mono text-[10px] text-slate-400" title={ver.file_hash}>
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SHA: {ver.file_hash ? ver.file_hash.substring(0, 12) + '...' : 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    {isLockedVersion ? (
                      <button
                        disabled
                        title="Download is disabled for Final Approved versions"
                        className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-xs border border-slate-300 shrink-0 cursor-not-allowed opacity-75"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Download Locked</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onDownloadVersion(ver)}
                        className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition border border-slate-300 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {ver.version_number}</span>
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">No version history records found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

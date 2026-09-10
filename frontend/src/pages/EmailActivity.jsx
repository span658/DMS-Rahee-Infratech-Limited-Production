import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Mail, RefreshCw, CheckCircle, Clock, Eye, X, Send } from 'lucide-react';

export default function EmailActivity() {
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/emails');
      if (res.data.success) {
        setEmailLogs(res.data.emailLogs);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Email Notifications Outbox</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time delivery log and preview of automated workflow emails dispatched to user email IDs.
          </p>
        </div>

        <button
          onClick={fetchEmailLogs}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Outbox</span>
        </button>
      </div>

      {/* Outbox Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading email logs...
          </div>
        ) : emailLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Recipient Email ID</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Delivery Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {log.recipient_email}
                      <span className="text-[10px] text-slate-400 font-sans block">{log.recipient_name}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {log.subject}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold text-slate-700 rounded border border-slate-200">
                        {log.event_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {log.document_title || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <Send className="w-3 h-3 mr-1" />
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(log)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Email Content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-sm">No Emails Dispatched Yet</p>
            <p className="mt-1">Workflow actions like document uploads and reviews will generate email log entries here.</p>
          </div>
        )}
      </div>

      {/* HTML Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-300">To: <span className="font-mono text-blue-300">{selectedEmail.recipient_email}</span></p>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div 
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FileText, 
  FolderTree, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Activity, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setCharts(res.data.charts);
        setRecentLogs(res.data.recentAuditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboard();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
  const categoryData = charts?.categoryBreakdown || charts?.categoryChartData || [];
  const companyData = charts?.companyBreakdown || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>{user?.is_super_admin ? 'Global Super Administrator View' : user?.organization_name}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Enterprise Document Management System (DMS) — Live Multi-Tenant Dashboard.
          </p>
        </div>

        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border border-white/20 backdrop-blur-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
        </button>
      </div>

      {/* Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Documents</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Uploaded & accessible files</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Folders</span>
            <FolderTree className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-indigo-900">{metrics?.totalFolders || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Directory tree folders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Files</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900">{metrics?.finalApproved || 0}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Workflow approved files</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tenant Scope</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-lg font-black text-indigo-900 truncate">
            {user?.is_super_admin ? 'RAHEE + IRCON' : user?.organization_name}
          </p>
          <p className="text-[11px] text-indigo-700 mt-1">Isolated Company Directories</p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Document Format Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Document Type Distribution</span>
            </h3>

            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
                No document format distribution data recorded yet.
              </div>
            )}
          </div>

          {categoryData.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="font-bold text-slate-700">{item.category}:</span>
                  <span className="text-slate-500 font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Documents by Organization (Multi-Tenant View) */}
        {user?.is_super_admin && companyData.length > 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Documents by Company (Rahee vs Ircon)</span>
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="company" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip formatter={(val, name, item) => [val, item.payload.company_name || name]} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {companyData.map((entry, index) => (
                        <Cell 
                          key={`cell-bar-${index}`} 
                          fill={entry.company === 'RAHEE' ? '#3b82f6' : '#6366f1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {companyData.map((c, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: c.company === 'RAHEE' ? '#3b82f6' : '#6366f1' }}
                  ></span>
                  <span className="font-bold text-slate-700">{c.company_name || c.company}:</span>
                  <span className="text-slate-500 font-mono font-bold">{c.count} files</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <Building2 className="w-10 h-10 text-indigo-400 mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-700">{user?.organization_name || 'Organization Workspace'}</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              All documents are isolated to your company repository.
            </p>
          </div>
        )}

      </div>

      {/* Recent Audit Log Feed */}
      {hasPermission('view_audit_logs') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Recent System Audit Trail Activity</span>
            </h3>
            <Link to="/audit-logs" className="text-xs font-bold text-blue-600 hover:underline">
              View All Logs &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.user_name || log.user_email}</span>
                      <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] text-slate-700 rounded font-bold">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-600 italic">{log.comment}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-4">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No audit activity logged yet.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

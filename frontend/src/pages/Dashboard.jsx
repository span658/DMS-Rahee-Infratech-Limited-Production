import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FileText, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Upload, 
  ShieldCheck, 
  TrendingUp, 
  Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setMetrics(res.data.metrics);
          setCharts(res.data.charts);
          setRecentLogs(res.data.recentAuditLogs);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#a855f7', '#10b981', '#ef4444'];

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
            Enterprise Document Management System (DMS) — Central Dashboard & Analytics.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Uploaded Documents</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Uploaded & stored in Bikramshila directory</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Documents (Version V1)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{metrics?.finalApproved || metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Permanently tagged as 'General Version V1'</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Documents by Workflow Status</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.statusBreakdown || []}>
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {charts?.statusBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Type Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Document Type Distribution</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            {charts?.categoryBreakdown && charts.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryBreakdown}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, count }) => `${category}: ${count}`}
                  >
                    {charts.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No category data recorded yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Recent Audit Log Feed (Only shown for users with view_audit_logs permission) */}
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

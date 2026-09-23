import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  PieChart as PieIcon, 
  Building2, 
  FolderTree, 
  CheckCircle2, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Reports() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReports = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setCharts(res.data.charts);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    // Auto refresh every 5 seconds when browser tab is actively visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchReports();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchReports]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
  const STATUS_COLORS = {
    'FINAL_APPROVED': '#10b981',
    'APPROVED': '#10b981',
    'PENDING_REVIEW_1': '#f59e0b',
    'PENDING_REVIEW_2': '#3b82f6',
    'FINAL_APPROVAL_PENDING': '#8b5cf6',
    'REJECTED': '#ef4444',
    'DRAFT': '#94a3b8'
  };

  const categoryData = charts?.categoryBreakdown || charts?.categoryChartData || [];
  const statusData = charts?.statusBreakdown || [];
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
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Enterprise Analytics & Live Reports</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Metrics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live breakdown of documents, folder hierarchy, file types, and organizations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono">
              Live Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Documents</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active files in system</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Folders</span>
            <FolderTree className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-indigo-900">{metrics?.totalFolders || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Directory hierarchy nodes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Documents</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-900">{metrics?.finalApproved || 0}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Fully approved & accessible</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tenant Scope</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-lg font-black text-indigo-900 truncate">
            {user?.is_super_admin ? 'RAHEE + IRCON' : user?.organization_name}
          </p>
          <p className="text-[11px] text-indigo-700 mt-1">Multi-Tenant Company Tree</p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Documents by File Format */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <span>Documents by File Format</span>
            </h3>

            {categoryData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="category"
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
              <div className="h-72 flex items-center justify-center text-xs text-slate-400 italic">
                No document format distribution data available.
              </div>
            )}
          </div>

          {/* Quick format count pills */}
          {categoryData.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="font-bold text-slate-700">{item.category}:</span>
                  <span className="text-slate-500 font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Documents by Organization (Company) */}
        {user?.is_super_admin && companyData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Documents by Company (Rahee vs Ircon)</span>
              </h3>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="company" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip 
                      formatter={(val, name, item) => [val, item.payload.company_name || name]} 
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {companyData.map((entry, index) => (
                        <Cell 
                          key={`cell-org-${index}`} 
                          fill={entry.company === 'RAHEE' ? '#3b82f6' : entry.company === 'IRCON' ? '#6366f1' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {companyData.map((c, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: c.company === 'RAHEE' ? '#3b82f6' : c.company === 'IRCON' ? '#6366f1' : '#10b981' }}
                  ></span>
                  <span className="font-bold text-slate-700">{c.company_name || c.company}:</span>
                  <span className="text-slate-500 font-mono font-bold">{c.count} documents</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Workflow Status Distribution */}
        {statusData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Workflow Status Distribution</span>
              </h3>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-status-${index}`} 
                          fill={STATUS_COLORS[entry.status] || '#3b82f6'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {statusData.map((s, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || '#3b82f6' }}></span>
                  <span className="font-bold text-slate-700">{s.status.replace(/_/g, ' ')}:</span>
                  <span className="text-slate-500 font-mono font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

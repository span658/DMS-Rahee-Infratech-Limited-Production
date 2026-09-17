import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  PieChart as PieIcon, 
  Building2, 
  HardDrive, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function Reports() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data.success) {
          setMetrics(res.data.metrics);
          setCharts(res.data.charts);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load reports:', err);
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#a855f7', '#ef4444'];

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
            <span>Enterprise Analytics & System Reports</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Metrics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time breakdown of storage, document types, and organization repository analytics.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Repository Documents</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Stored across Bikramshila folder tree</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Approved Documents</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{metrics?.finalApproved || metrics?.totalDocuments || 0}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Available for preview & download</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tenant Scope</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900">{user?.is_super_admin ? 'Multi-Tenant (Rahee + Ircon)' : user?.organization_name}</p>
          <p className="text-[11px] text-indigo-700 mt-1">Bikramshila Directory Hierarchy</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category / Document Type Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-blue-600" />
            <span>Documents by File Type</span>
          </h3>

          {charts?.categoryChartData && charts.categoryChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                    label={({ category, count }) => `${category}: ${count}`}
                  >
                    {charts.categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
              No document format distribution data available.
            </div>
          )}
        </div>

        {/* Workflow Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Documents Distribution by Status</span>
          </h3>

          {charts?.statusChartData && charts.statusChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.statusChartData}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {charts.statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
              No status breakdown data available.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

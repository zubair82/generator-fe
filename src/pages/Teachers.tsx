import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
  ArrowUpDown,
  FileText,
  IndianRupee,
  Network,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  SlidersHorizontal,
  Download,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { AdminMetricsRow, AdminMetricsData } from '../components/admin/AdminMetricsRow';

export interface TeacherApplicationItem {
  applicant_id: string;
  name: string;
  email: string;
  channel_url?: string | null;
  submitted_at?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  admin_notes?: string | null;
}

export interface TeacherRosterItem {
  teacher_id: string;
  institute_name: string;
  referral_code?: string | null;
  roster_size: number;
  live_papers: number;
  total_earnings_inr: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | string;
  joined_at?: string | null;
}

export interface PaginationMeta {
  current_page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface TeacherRosterResponse {
  status: string;
  data: TeacherRosterItem[];
  meta: PaginationMeta;
}

export interface AdminMetricsResponse {
  status: string;
  data: AdminMetricsData;
}

// Fallback seed data in case API is running in mock/offline mode
const FALLBACK_TEACHERS: TeacherRosterItem[] = [
  {
    teacher_id: "uuid-1234",
    institute_name: "Concept Physics",
    referral_code: "TCHR-P9X442",
    roster_size: 840,
    live_papers: 12,
    total_earnings_inr: 45000.00,
    status: "ACTIVE",
    joined_at: "2025-10-12T10:30:00Z"
  },
  {
    teacher_id: "uuid-5678",
    institute_name: "Elite Math Academy",
    referral_code: "TCHR-M2L901",
    roster_size: 320,
    live_papers: 5,
    total_earnings_inr: 18500.00,
    status: "ACTIVE",
    joined_at: "2026-01-05T14:15:00Z"
  },
  {
    teacher_id: "uuid-9012",
    institute_name: "Quantum Chemistry Classes",
    referral_code: "TCHR-Q7C331",
    roster_size: 140,
    live_papers: 3,
    total_earnings_inr: 7200.00,
    status: "PENDING",
    joined_at: "2026-02-14T09:20:00Z"
  },
  {
    teacher_id: "uuid-3456",
    institute_name: "Kota Physics Hub",
    referral_code: "TCHR-K4P882",
    roster_size: 1250,
    live_papers: 18,
    total_earnings_inr: 89400.00,
    status: "ACTIVE",
    joined_at: "2025-08-20T16:00:00Z"
  },
  {
    teacher_id: "uuid-7890",
    institute_name: "Apex Biology Institute",
    referral_code: "TCHR-A1B509",
    roster_size: 95,
    live_papers: 1,
    total_earnings_inr: 3400.00,
    status: "SUSPENDED",
    joined_at: "2025-11-30T11:45:00Z"
  }
];

const FALLBACK_METRICS: AdminMetricsData = {
  total_active_teachers: 142,
  total_supply_volume: 384,
  total_pending_payouts_inr: 45200.00,
  total_network_roster: 4250
};

export function Teachers() {
  const { token } = useAuth();
  const { addToast } = useUI();

  // Filter & Query States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'roster_size' | 'total_earnings' | 'live_papers' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal & Action states
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRosterItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const authFetcher = async (url: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res.json();
  };

  // 1. Fetch Metrics Data with SWR
  const metricsUrl = `${apiUrl}/api/v1/admin/teachers/metrics${isForceRefreshing ? '?force_refresh=true' : ''}`;
  const {
    data: metricsResponse,
    isLoading: isMetricsLoading,
    mutate: mutateMetrics
  } = useSWR<AdminMetricsResponse>(
    apiUrl ? metricsUrl : null,
    authFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      fallbackData: { status: 'success', data: FALLBACK_METRICS }
    }
  );

  // 2. Fetch Teacher Roster Table Data with SWR
  const tableQueryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort_by: sortBy,
    sort_order: sortOrder
  });
  if (statusFilter && statusFilter !== 'ALL') {
    tableQueryParams.set('status', statusFilter);
  }
  if (debouncedSearch) {
    tableQueryParams.set('search', debouncedSearch);
  }

  const tableUrl = `${apiUrl}/api/v1/admin/teachers?${tableQueryParams.toString()}`;
  const {
    data: tableResponse,
    isLoading: isTableLoading,
    mutate: mutateTable
  } = useSWR<TeacherRosterResponse>(
    apiUrl ? tableUrl : null,
    authFetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      fallbackData: {
        status: 'success',
        data: FALLBACK_TEACHERS,
        meta: {
          current_page: 1,
          limit: 10,
          total_records: FALLBACK_TEACHERS.length,
          total_pages: 1,
          has_next: false,
          has_previous: false
        }
      }
    }
  );

  const metricsData = metricsResponse?.data || FALLBACK_METRICS;
  const teachers = tableResponse?.data || [];
  const meta: PaginationMeta = tableResponse?.meta || {
    current_page: page,
    limit,
    total_records: teachers.length,
    total_pages: Math.ceil(teachers.length / limit) || 1,
    has_next: false,
    has_previous: false
  };

  const [activeMainTab, setActiveMainTab] = useState<'roster' | 'applications'>('roster');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [appPage, setAppPage] = useState(1);
  const [isUpdatingApp, setIsUpdatingApp] = useState<string | null>(null);

  // 3. Fetch Applications Funnel via GET /api/v1/admin/applications
  const appQueryParams = new URLSearchParams();
  if (appStatusFilter !== 'ALL') {
    appQueryParams.set('status', appStatusFilter);
  }
  appQueryParams.set('page', String(appPage));
  appQueryParams.set('limit', '10');

  const {
    data: applicationsResponse,
    isLoading: isApplicationsLoading,
    mutate: mutateApplications
  } = useSWR<{ status: string; data: TeacherApplicationItem[]; meta: PaginationMeta }>(
    apiUrl && activeMainTab === 'applications' ? `${apiUrl}/api/v1/admin/applications?${appQueryParams.toString()}` : null,
    authFetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const applicationsList: TeacherApplicationItem[] = applicationsResponse?.data || [];
  const applicationsMeta: PaginationMeta = applicationsResponse?.meta || {
    current_page: appPage,
    limit: 10,
    total_records: applicationsList.length,
    total_pages: Math.ceil(applicationsList.length / 10) || 1,
    has_next: false,
    has_previous: false
  };

  const handleUpdateApplicationStatus = async (applicationId: string, targetStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setIsUpdatingApp(applicationId);
      const res = await fetch(`${apiUrl}/api/v1/admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: targetStatus === 'APPROVED' ? 'Approved by admin' : 'Rejected by admin'
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to update application (${res.status})`);
      }

      await Promise.all([
        mutateApplications(),
        mutateTable(),
        mutateMetrics()
      ]);

      addToast(
        targetStatus === 'APPROVED'
          ? 'Application approved! Promoted to TEACHER and referral code generated.'
          : 'Application rejected.',
        'success'
      );
    } catch (err: any) {
      console.error('Application status update error:', err);
      addToast(err.message || 'Failed to update application status', 'error');
    } finally {
      setIsUpdatingApp(null);
    }
  };

  // Trigger cache bypass & force recalculation
  const handleForceRefresh = async () => {
    try {
      setIsForceRefreshing(true);
      await Promise.all([
        mutateMetrics(),
        mutateTable(),
        mutateApplications()
      ]);
      addToast('Refreshed live platform metrics & teacher roster', 'success');
    } catch (err) {
      console.error(err);
      addToast('Error refreshing metrics', 'error');
    } finally {
      setIsForceRefreshing(false);
    }
  };

  // Handle Teacher Status Change (Approve, Suspend, Pending)
  const handleUpdateStatus = async (teacherId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(teacherId);
      const res = await fetch(`${apiUrl}/api/v1/admin/teachers/${teacherId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: newStatus === 'SUSPENDED' ? 'Administrative suspension' : ''
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to update status (${res.status})`);
      }

      // Optimistically update table data
      mutateTable((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map(t => t.teacher_id === teacherId ? { ...t, status: newStatus } : t)
        };
      }, false);

      mutateMetrics();
      addToast(`Teacher status updated to ${newStatus}`, 'success');
      if (selectedTeacher && selectedTeacher.teacher_id === teacherId) {
        setSelectedTeacher(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error('Status update failed:', err);
      addToast(err.message || 'Failed to update teacher status', 'error');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Suspended
      </span>
    );
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Teacher Supply & Network Roster
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise overview of registered educators, live question papers catalog, student referral volume, and billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleForceRefresh}
            disabled={isForceRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isForceRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>{isForceRefreshing ? 'Refreshing...' : 'Force Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Top-Level Metrics Row (User-provided layout) */}
      <AdminMetricsRow data={metricsData} isLoading={isMetricsLoading} />

      {/* Main Mode Switcher: Teacher Supply Roster vs Applications Onboarding Funnel */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700/60 pb-px">
        <button
          onClick={() => setActiveMainTab('roster')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'roster'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Active Teachers Roster ({meta.total_records})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('applications')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'applications'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Applications Funnel ({applicationsMeta.total_records})</span>
        </button>
      </div>

      {activeMainTab === 'roster' ? (
        /* Filter and Table Card for Teachers Roster */
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by institute name, referral code, or ID..."
              className="w-full bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1a1e29] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            )}
          </div>

          {/* Controls Right */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#1a1e29] border border-slate-200/80 dark:border-slate-700/80">
              {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white dark:bg-[#252b3b] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="created_at">Joined Date</option>
                <option value="roster_size">Roster Size</option>
                <option value="total_earnings">Total Earnings</option>
                <option value="live_papers">Live Papers</option>
              </select>

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                title={`Sort ${sortOrder === 'DESC' ? 'Descending' : 'Ascending'}`}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1e29] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-[#1e2330]/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Teacher / Institute</th>
                <th className="py-3.5 px-6">Referral Code</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Network Roster</th>
                <th className="py-3.5 px-6 text-right">Live Papers</th>
                <th className="py-3.5 px-6 text-right">Total Earnings</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isTableLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
                        <div className="space-y-1.5">
                          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700/60 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">No teachers found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {search ? `No records matching "${search}". Try clearing your search filters.` : 'No teachers registered under the selected status criteria.'}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-4 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const isUpdating = isUpdatingStatus === teacher.teacher_id;
                  const initials = teacher.institute_name
                    ? teacher.institute_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'T';

                  return (
                    <tr
                      key={teacher.teacher_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1e2330]/50 transition-colors group"
                    >
                      {/* Teacher / Institute */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {teacher.institute_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                                {teacher.teacher_id}
                              </span>
                              <button
                                onClick={() => handleCopy(teacher.teacher_id, `id-${teacher.teacher_id}`)}
                                title="Copy Teacher ID"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {copiedId === `id-${teacher.teacher_id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="py-4 px-6">
                        {teacher.referral_code ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700/60 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>{teacher.referral_code}</span>
                            <button
                              onClick={() => handleCopy(teacher.referral_code!, `ref-${teacher.teacher_id}`)}
                              title="Copy Referral Code"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {copiedId === `ref-${teacher.teacher_id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {getStatusBadge(teacher.status)}
                      </td>

                      {/* Network Roster */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{Number(teacher.roster_size || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </td>

                      {/* Live Papers */}
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {teacher.live_papers || 0}
                        </span>
                      </td>

                      {/* Total Earnings */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ₹{Number(teacher.total_earnings_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(teacher.joined_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* THE NAVIGATION TRIGGER */}
                          <Link
                            to={`/admin/teachers/${teacher.teacher_id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors"
                          >
                            {teacher.status === 'PENDING' ? 'Review' : 'View Details'}
                          </Link>

                          {/* Quick Action: Approve if pending/suspended */}
                          {teacher.status !== 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateStatus(teacher.teacher_id, 'ACTIVE')}
                              disabled={isUpdating}
                              title="Approve & Activate Teacher"
                              className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? '...' : 'Approve'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(teacher.teacher_id, 'SUSPENDED')}
                              disabled={isUpdating}
                              title="Suspend Teacher"
                              className="px-2.5 py-1.5 rounded-md text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? '...' : 'Suspend'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-slate-100">{teachers.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(page * limit, meta.total_records || teachers.length)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{meta.total_records || teachers.length}</span> registered educators
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
              Page {page} of {meta.total_pages || 1}
            </span>

            <button
              onClick={() => setPage(p => Math.min(meta.total_pages || 1, p + 1))}
              disabled={page >= (meta.total_pages || 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      ) : (
        /* Applications Funnel Table Card */
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
          {/* Header & Status Filter */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Teacher Onboarding Applicant Funnel
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review applicant credentials, channel portfolios, and approve them to grant immediate teacher status and referral codes.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#1a1e29] border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setAppStatusFilter(st);
                    setAppPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    appStatusFilter === st
                      ? 'bg-white dark:bg-[#252b3b] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 dark:bg-[#1e2330]/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Applicant Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Channel / Portfolio</th>
                  <th className="py-3 px-6">Submitted Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {isApplicationsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading applications from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : applicationsList.length > 0 ? (
                  applicationsList.map((app) => (
                    <tr key={app.applicant_id} className="hover:bg-slate-50/70 dark:hover:bg-[#1e2330]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">
                        {app.name}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                        {app.email || '—'}
                      </td>
                      <td className="py-4 px-6">
                        {app.channel_url ? (
                          <a
                            href={app.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
                          >
                            <span>Open Channel</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(app.submitted_at)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            app.status === 'APPROVED' ? 'bg-emerald-500' : app.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {app.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.applicant_id, 'APPROVED')}
                              disabled={isUpdatingApp === app.applicant_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.applicant_id, 'REJECTED')}
                              disabled={isUpdatingApp === app.applicant_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      No applications found for selected status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Applications Pagination */}
          {applicationsMeta.total_pages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {applicationsList.length} of {applicationsMeta.total_records} applications
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppPage(p => Math.max(1, p - 1))}
                  disabled={!applicationsMeta.has_previous}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Previous
                </button>
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                  {applicationsMeta.current_page}
                </span>
                <button
                  onClick={() => setAppPage(p => p + 1)}
                  disabled={!applicationsMeta.has_next}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teacher Details Drawer / Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedTeacher.institute_name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedTeacher.teacher_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                &times;
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Roster Students</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedTeacher.roster_size}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Live Papers</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedTeacher.live_papers}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Gross Earned</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  ₹{Number(selectedTeacher.total_earnings_inr).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Referral Info */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Student Referral Link
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700/60">
                <input
                  readOnly
                  value={`http://examsimula.com/question-papers?ref=${selectedTeacher.referral_code || ''}`}
                  className="bg-transparent text-xs font-mono flex-1 text-slate-700 dark:text-slate-300 outline-none truncate"
                />
                <button
                  onClick={() => handleCopy(`http://examsimula.com/question-papers?ref=${selectedTeacher.referral_code || ''}`, 'modal-link')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#252b3b] shadow-xs text-blue-600 dark:text-blue-400 hover:bg-slate-50 transition-colors"
                >
                  {copiedId === 'modal-link' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Status Modification */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Update Account Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTeacher.teacher_id, 'ACTIVE')}
                  disabled={selectedTeacher.status === 'ACTIVE' || Boolean(isUpdatingStatus)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTeacher.status === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTeacher.teacher_id, 'PENDING')}
                  disabled={selectedTeacher.status === 'PENDING' || Boolean(isUpdatingStatus)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTeacher.status === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTeacher.teacher_id, 'SUSPENDED')}
                  disabled={selectedTeacher.status === 'SUSPENDED' || Boolean(isUpdatingStatus)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTeacher.status === 'SUSPENDED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  Suspend
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;


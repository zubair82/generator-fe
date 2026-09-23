import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Share2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';

export type RevenueTier = 'all' | 'direct' | 'organic' | 'network';

export interface RosterSummary {
  total_roster_students?: {
    count?: number;
    formatted?: string;
    label?: string;
    subtitle?: string;
  };
  direct_70_cut?: {
    tier?: string;
    percentage?: number;
    students_count?: number;
    students_badge?: string;
    amount?: number;
    amount_inr?: number;
    amount_paise?: number;
    formatted?: string;
    subtitle?: string;
  };
  organic_50_cut?: {
    tier?: string;
    percentage?: number;
    students_count?: number;
    students_badge?: string;
    amount?: number;
    amount_inr?: number;
    amount_paise?: number;
    formatted?: string;
    subtitle?: string;
  };
  network_20_cut?: {
    tier?: string;
    percentage?: number;
    students_count?: number;
    students_badge?: string;
    amount?: number;
    amount_inr?: number;
    amount_paise?: number;
    formatted?: string;
    subtitle?: string;
  };
  total_net_earned?: {
    amount?: number;
    amount_inr?: number;
    amount_paise?: number;
    formatted?: string;
  };
}

export interface RosterTierCounts {
  all?: number;
  direct_70?: number;
  organic_50?: number;
  network_20?: number;
}

export interface RosterPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiRosterItem {
  id: string;
  student_id?: string;
  student_initials?: string;
  student_name?: string;
  student_display_id?: string;
  student_email?: string;
  paper_id?: number | string;
  paper_name?: string;
  paper_title?: string;
  exam_code?: string;
  gross_amount?: number;
  gross_amount_paise?: number;
  gross_formatted?: string;
  gross_label?: string;
  revenue_tier?: {
    tier?: string;
    percentage?: number;
    name?: string;
    badge?: string;
    type?: 'direct' | 'organic' | 'network' | string;
    color?: string;
  };
  net_earned?: {
    amount?: number;
    amount_paise?: number;
    formatted?: string;
    status?: string;
    status_badge?: string;
  };
  score?: {
    status?: string;
    score_formatted?: string;
    percentage?: number;
    percentage_label?: string;
    is_in_progress?: boolean;
    marks_obtained?: number;
    total_marks?: number;
  };
  completed_date?: {
    timestamp?: string;
    formatted_datetime?: string;
    relative_time?: string;
  };
}

export interface StudentRosterItem {
  id: string;
  displayId: string;
  initials: string;
  studentName: string;
  paperTitle: string;
  examCode: string;
  tier: 'direct' | 'organic' | 'network';
  tierLabel: string;
  tierPct: string;
  netEarned: number;
  netEarnedFormatted?: string;
  grossAmount: number;
  grossFormatted?: string;
  score: string | null;
  scorePct: number | null;
  status: 'Completed' | 'In Progress';
  completedDate: string;
  relativeTime: string;
  payoutStatus: 'Settled' | 'Pending Payout';
}

function formatStudentDisplayId(rawId?: string, studentId?: string, displayId?: string): string {
  if (displayId && displayId.trim()) {
    return displayId.startsWith('ID:') ? displayId : `ID: ${displayId}`;
  }

  if (studentId && studentId.trim()) {
    const clean = studentId.replace(/^usr_student_|^usr_|^st[_-]?/i, '');
    if (clean.length <= 6) {
      return `ID: ST-${clean.toUpperCase()}`;
    }
  }

  if (!rawId) return 'ID: ST-01';

  // If rawId is like "2b86a6c8-2551-4c41-bf5e-704a487e4559-10-inprogress" or "6-1784811326737"
  const cleanId = rawId.replace(/-(?:in_?progress|completed)$/i, '');
  const parts = cleanId.split('-');

  if (parts.length > 1 && parts[0].length <= 4 && !isNaN(Number(parts[0]))) {
    return `ID: ST-${parts[0].padStart(2, '0')}`;
  }

  const hexPart = parts[0];
  if (hexPart.length >= 4) {
    return `ID: ST-${hexPart.slice(0, 6).toUpperCase()}`;
  }

  return `ID: ST-${cleanId.slice(0, 6).toUpperCase()}`;
}

function normalizeRosterItem(item: ApiRosterItem): StudentRosterItem {
  const tierType = (item.revenue_tier?.type || '').toLowerCase();
  const tierStr = (item.revenue_tier?.tier || '').toUpperCase();
  const pct = item.revenue_tier?.percentage || 0;

  let resolvedTier: 'direct' | 'organic' | 'network' = 'direct';
  if (tierType === 'organic' || tierType === 'marketplace' || tierStr.includes('50') || tierStr.includes('ORGANIC') || pct === 50) {
    resolvedTier = 'organic';
  } else if (tierType === 'network' || tierType === 'affiliate' || tierStr.includes('20') || tierStr.includes('NETWORK') || pct === 20) {
    resolvedTier = 'network';
  }

  const tierPctLabel = `${pct || (resolvedTier === 'direct' ? 70 : resolvedTier === 'organic' ? 50 : 20)}%`;
  const tierName = item.revenue_tier?.name || (resolvedTier === 'direct' ? 'Direct Referral' : resolvedTier === 'organic' ? 'Marketplace Organic' : 'Network Cross-Sale');

  const isInProgress = Boolean(item.score?.is_in_progress || (item.score?.status && item.score.status.toLowerCase() === 'in_progress'));

  const statusBadge = item.net_earned?.status_badge || (
    item.net_earned?.status === 'settled' || item.net_earned?.status === 'paid'
      ? 'Settled'
      : 'Pending Payout'
  );

  const rawId = item.id || item.student_id || `att-${Math.random().toString(36).slice(2, 7)}`;
  const cleanDisplayId = formatStudentDisplayId(item.id, item.student_id, item.student_display_id);

  return {
    id: rawId,
    displayId: cleanDisplayId,
    initials: item.student_initials || (item.student_name ? item.student_name.slice(0, 4) : 'S. K.'),
    studentName: item.student_name || item.student_initials || 'Student',
    paperTitle: item.paper_title || item.paper_name || 'Exam Paper',
    examCode: item.exam_code || 'EXAM',
    tier: resolvedTier,
    tierLabel: tierName,
    tierPct: tierPctLabel,
    netEarned: Number(item.net_earned?.amount || 0),
    netEarnedFormatted: item.net_earned?.formatted,
    grossAmount: Number(item.gross_amount || 0),
    grossFormatted: item.gross_formatted,
    score: isInProgress ? null : (item.score?.score_formatted || (item.score?.marks_obtained !== undefined ? `${item.score.marks_obtained}/${item.score.total_marks || 100}` : '80/100')),
    scorePct: isInProgress ? null : (item.score?.percentage ?? (item.score?.marks_obtained !== undefined ? Math.round((item.score.marks_obtained / (item.score.total_marks || 100)) * 100) : 80)),
    status: isInProgress ? 'In Progress' : 'Completed',
    completedDate: item.completed_date?.formatted_datetime || item.completed_date?.timestamp || 'Recently',
    relativeTime: item.completed_date?.relative_time || 'Just now',
    payoutStatus: statusBadge === 'Settled' ? 'Settled' : 'Pending Payout'
  };
}

export function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useUI();
  const { user } = useAuth();

  // Tier URL parameter normalization
  const rawTier = searchParams.get('tier')?.toLowerCase() || 'all';
  const activeTier: RevenueTier =
    rawTier === 'direct' || rawTier === '70' || rawTier === '70_direct'
      ? 'direct'
      : rawTier === 'organic' || rawTier === 'marketplace' || rawTier === '50' || rawTier === '50_organic'
      ? 'organic'
      : rawTier === 'network' || rawTier === 'cross-sale' || rawTier === '20' || rawTier === '20_network'
      ? 'network'
      : 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'net_desc' | 'score_desc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rosterItems, setRosterItems] = useState<StudentRosterItem[]>([]);
  const [apiSummary, setApiSummary] = useState<RosterSummary | null>(null);
  const [apiTierCounts, setApiTierCounts] = useState<RosterTierCounts | null>(null);
  const [apiPagination, setApiPagination] = useState<RosterPagination | null>(null);

  // Fetch from API
  const fetchRosterData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const queryParams = new URLSearchParams();
      if (activeTier !== 'all') {
        queryParams.set('tier', activeTier);
      }
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }
      if (statusFilter === 'COMPLETED') {
        queryParams.set('status', 'completed');
      } else if (statusFilter === 'IN_PROGRESS') {
        queryParams.set('status', 'in_progress');
      }

      // Sort param mapping
      const sortMap: Record<string, string> = {
        date_desc: 'latest',
        date_asc: 'oldest',
        net_desc: 'revenue_desc',
        score_desc: 'score_desc'
      };
      queryParams.set('sort_by', sortMap[sortBy] || 'latest');
      queryParams.set('page', String(currentPage));
      queryParams.set('page_size', String(itemsPerPage));

      const response = await fetch(`${apiUrl}/api/v1/students/roster?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.roster && Array.isArray(data.roster)) {
          const mapped = data.roster.map(normalizeRosterItem);
          setRosterItems(mapped);
        } else {
          setRosterItems([]);
        }

        if (data.summary) {
          setApiSummary(data.summary);
        }
        if (data.tier_counts) {
          setApiTierCounts(data.tier_counts);
        }
        if (data.pagination) {
          setApiPagination(data.pagination);
        }
      } else {
        console.warn('Roster API returned error status:', response.status);
        addToast('Failed to fetch student roster from server', 'error');
      }
    } catch (err) {
      console.error('Error fetching student roster:', err);
      addToast('Network error loading student roster', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTier, searchQuery, statusFilter, sortBy, currentPage, itemsPerPage, addToast]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchRosterData();
  }, [fetchRosterData]);

  // Handle tier tab selection
  const handleTabChange = (tier: RevenueTier) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tier === 'all') {
      nextParams.delete('tier');
    } else {
      nextParams.set('tier', tier);
    }
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const res = await fetch(`${apiUrl}/api/v1/students/roster/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ExamSimula_Student_Roster_${activeTier}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addToast('Student Roster exported as CSV!', 'success');
        return;
      }
    } catch (err) {
      console.warn('Server CSV export error, falling back to client CSV:', err);
    }

    // Client-side fallback
    const headers = ['Student', 'Exam Paper', 'Exam Code', 'Revenue Tier', 'Commission Rate', 'Net Earned (INR)', 'Gross Amount', 'Score/Status', 'Completed Date', 'Payout Status'];
    const rows = rosterItems.map((r) => [
      `"${r.studentName}"`,
      `"${r.paperTitle}"`,
      `"${r.examCode}"`,
      `"${r.tierLabel}"`,
      `"${r.tierPct}"`,
      r.netEarned.toFixed(2),
      r.grossAmount.toFixed(2),
      `"${r.score || r.status}"`,
      `"${r.completedDate}"`,
      `"${r.payoutStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamSimula_Student_Roster_${activeTier}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Student Roster exported as CSV!', 'success');
  };

  // Stats summaries (from API or derived from roster)
  const totalCount = apiTierCounts?.all ?? apiSummary?.total_roster_students?.count ?? rosterItems.length;
  const directCount = apiTierCounts?.direct_70 ?? apiSummary?.direct_70_cut?.students_count ?? rosterItems.filter((r) => r.tier === 'direct').length;
  const organicCount = apiTierCounts?.organic_50 ?? apiSummary?.organic_50_cut?.students_count ?? rosterItems.filter((r) => r.tier === 'organic').length;
  const networkCount = apiTierCounts?.network_20 ?? apiSummary?.network_20_cut?.students_count ?? rosterItems.filter((r) => r.tier === 'network').length;

  const directFormatted = apiSummary?.direct_70_cut?.formatted ?? `₹${(apiSummary?.direct_70_cut?.amount ?? rosterItems.filter((r) => r.tier === 'direct').reduce((s, r) => s + r.netEarned, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const organicFormatted = apiSummary?.organic_50_cut?.formatted ?? `₹${(apiSummary?.organic_50_cut?.amount ?? rosterItems.filter((r) => r.tier === 'organic').reduce((s, r) => s + r.netEarned, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const networkFormatted = apiSummary?.network_20_cut?.formatted ?? `₹${(apiSummary?.network_20_cut?.amount ?? rosterItems.filter((r) => r.tier === 'network').reduce((s, r) => s + r.netEarned, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Pagination calculation
  const totalPages = apiPagination?.total_pages ?? Math.max(1, Math.ceil((apiPagination?.total_items ?? rosterItems.length) / itemsPerPage));



  return (
    <div className="space-y-8 flex-1 w-full max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/70 text-[#003fb1] dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Student Roster & Payout Ledger
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-11">
            Row-by-row attribution reconciling academic exam attempts with your 70%, 50%, and 20% creator payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRosterData(true)}
            disabled={refreshing || loading}
            title="Refresh student roster"
            className="p-2.5 bg-white dark:bg-[#252b3b] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#003fb1]' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white dark:bg-[#252b3b] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 bg-[#003fb1] dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* KPI Mini-Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Roster Students
            </span>
            <span className="p-2 bg-slate-100 dark:bg-[#1a1e29] text-slate-600 dark:text-slate-300 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalCount}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unique enrolled candidates</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 border-l-4 border-l-blue-600 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Direct 70% Cut
            </span>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-bold rounded-full uppercase">
              {directCount} students
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {directFormatted}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your YouTube audience conversion</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Organic 50% Cut
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-full uppercase">
              {organicCount} students
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {organicFormatted}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ExamSimula marketplace discovery</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Network 20% Cut
            </span>
            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold rounded-full uppercase">
              {networkCount} students
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {networkFormatted}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cross-pollination passive revenue</p>
          </div>
        </motion.div>
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden transition-colors"
      >
        {/* Controls Header: Segmented Control Tabs + Search Bar + Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#1e2330]">
          {/* Segmented Control Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-[#161a24] p-1 rounded-xl border border-slate-300/70 dark:border-slate-700/60 overflow-x-auto hide-scrollbar shrink-0">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTier === 'all'
                  ? 'bg-white dark:bg-[#252b3b] text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>All Roster</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTier === 'all' ? 'bg-slate-100 dark:bg-[#1a1e29] text-slate-800 dark:text-slate-200' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('direct')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTier === 'direct'
                  ? 'bg-white dark:bg-[#252b3b] text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Direct (70%)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTier === 'direct' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {directCount}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('organic')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTier === 'organic'
                  ? 'bg-white dark:bg-[#252b3b] text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Organic (50%)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTier === 'organic' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {organicCount}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('network')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTier === 'network'
                  ? 'bg-white dark:bg-[#252b3b] text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Network (20%)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTier === 'network' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {networkCount}
              </span>
            </button>
          </div>

          {/* Search Bar & Sort Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl justify-end">
            {/* Real-time search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filter by exam paper title or student initials..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 transition-all shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs absolute right-2.5 top-2.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 shadow-sm"
              >
                <option value="date_desc">Latest Activity</option>
                <option value="date_asc">Oldest Activity</option>
                <option value="net_desc">Highest Net Earnings</option>
                <option value="score_desc">Highest Academic Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/70 bg-slate-50/75 dark:bg-[#1f2433] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-5">Exam Paper</th>
                <th className="py-3.5 px-5">Revenue Tier</th>
                <th className="py-3.5 px-5 text-right">Net Earned</th>
                <th className="py-3.5 px-5 text-center">Score / Status</th>
                <th className="py-3.5 px-5 text-right">Completed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-3 border-[#003fb1] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold">Loading student roster...</p>
                    </div>
                  </td>
                </tr>
              ) : rosterItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1a1e29] flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        No students found matching current filters
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? `No student entries match "${searchQuery}".`
                          : 'No candidates enrolled under this revenue tier yet.'}
                      </p>
                      {(searchQuery || activeTier !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            handleTabChange('all');
                          }}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-[#003fb1] dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rosterItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#2d3446]/50 transition-colors"
                  >
                    {/* Column 1: Student (Anonymized Initials & Clean ID Tag) */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#003fb1] dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800/60 shadow-sm shrink-0">
                          {item.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.studentName}</p>
                          <span
                            className="text-[10px] text-slate-400 dark:text-slate-400 font-mono tracking-wider block mt-0.5"
                            title={`Full Attempt ID: ${item.id}`}
                          >
                            {item.displayId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Exam Paper */}
                    <td className="py-4 px-5">
                      <div className="max-w-md">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.paperTitle}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a1e29] text-slate-600 dark:text-slate-300 font-semibold text-[10px] rounded uppercase">
                            {item.examCode}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.grossFormatted || `Gross: ₹${item.grossAmount.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Revenue Tier */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border shadow-xs ${
                          item.tier === 'direct'
                            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80'
                            : item.tier === 'organic'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                            : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.tier === 'direct'
                              ? 'bg-blue-600'
                              : item.tier === 'organic'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        ></span>
                        <span>{item.tierPct} Cut</span>
                        <span className="opacity-70 font-normal">({item.tierLabel})</span>
                      </span>
                    </td>

                    {/* Column 4: Net Earned */}
                    <td className="py-4 px-5 text-right">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {item.netEarnedFormatted || `₹${item.netEarned.toFixed(2)}`}
                      </p>
                      <span
                        className={`text-[10px] font-semibold ${
                          item.payoutStatus === 'Settled'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-400'
                        }`}
                      >
                        {item.payoutStatus}
                      </span>
                    </td>

                    {/* Column 5: Score / Status */}
                    <td className="py-4 px-5 text-center">
                      {item.score ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 dark:bg-[#1a1e29] text-slate-800 dark:text-slate-200">
                            {item.score}
                          </span>
                          <span
                            className={`text-[10px] font-semibold mt-0.5 ${
                              (item.scorePct || 0) >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (item.scorePct || 0) >= 60
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.scorePct}% Score
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                          <Clock className="w-3 h-3 animate-pulse" />
                          In Progress
                        </span>
                      )}
                    </td>

                    {/* Column 6: Completed Date */}
                    <td className="py-4 px-5 text-right">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{item.completedDate}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                        {item.relativeTime}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        {(apiPagination ? apiPagination.total_items > itemsPerPage : rosterItems.length > 0) && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-[#1e2330] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {rosterItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, apiPagination?.total_items ?? rosterItems.length)}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {apiPagination?.total_items ?? rosterItems.length}
              </strong>{' '}
              candidates
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-[#003fb1] dark:bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-[#252b3b] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Edit3,
  ExternalLink,
  Eye,
  IndianRupee,
  Clock,
  Layers,
  ShoppingBag,
  TrendingUp,
  X,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

interface ExamPaperItem {
  id?: number | string;
  paper_name: string;
  display_title?: string;
  exam_code: string;
  created_at: string | null;
  state: string;
  type?: string;
  is_active: boolean;
  questions_count?: number;
  total_questions?: number;
  year_and_shift?: string;
  price?: number | null;
  duration?: number | null;
  duration_mins?: number | null;
  attempts_count?: number;
  gross_revenue?: number;
  revenue_formatted?: string;
}

type SortField = 'title' | 'category' | 'price' | 'attempts' | 'revenue' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';
type TabFilter = 'ALL' | 'ACTIVE' | 'REVIEW' | 'DRAFTS';

// Helper: Format raw database paper names into clean, readable titles
function formatPaperTitle(raw: string): string {
  if (!raw) return 'Untitled Exam Paper';
  if (!raw.includes('_') && !raw.includes('-varient')) {
    return raw;
  }

  let formatted = raw
    .replace(/_varient$/i, ' (Variant)')
    .replace(/_variant$/i, ' (Variant)')
    .replace(/_orig$/i, ' (Original)')
    .replace(/_original$/i, ' (Original)')
    .replace(/_Shift_(\d+)/gi, ' (Shift $1)')
    .replace(/_Shift(\d+)/gi, ' (Shift $1)')
    .replace(/_Session_(\d+)/gi, ' (Session $1)')
    .replace(/_Session(\d+)/gi, ' (Session $1)')
    .replace(/_/g, ' ');

  formatted = formatted.replace(/\bJEE[-_]Mains\b/gi, 'JEE Mains -');
  formatted = formatted.replace(/\bJEE[-_]Adv(anced)?\b/gi, 'JEE Advanced -');
  formatted = formatted.replace(/\bNEET[-_]UG\b/gi, 'NEET UG -');

  return formatted.replace(/\s+/g, ' ').trim();
}

// Helper: Format upload date
function formatUploadedDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Added recently';
  try {
    const d = new Date(dateStr);
    return `Added ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Added recently';
  }
}

export function Papers() {
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [apiPapers, setApiPapers] = useState<ExamPaperItem[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Quick Edit Modal State
  const [editingPaper, setEditingPaper] = useState<ExamPaperItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number>(150);
  const [editDuration, setEditDuration] = useState<number>(180);
  const [editIsActive, setEditIsActive] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Dropdown menu state (paper_name of open menu)
  const [openMenuPaper, setOpenMenuPaper] = useState<string | null>(null);

  // Close dropdown on outside click
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuPaper(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch papers and performance metadata
  const fetchingRef = useRef(false);
  useEffect(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const fetchAllPapersData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch exam papers and top-papers
        const [papersRes, topPapersRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/exam-papers`, { headers }),
          fetch(`${apiUrl}/api/v1/earnings/top-papers?limit=50`, { headers })
        ]);

        let papersList: ExamPaperItem[] = [];
        if (papersRes.status === 'fulfilled' && papersRes.value.ok) {
          const data = await papersRes.value.json();
          papersList = data.papers || [];
        }

        // 2. Performance & metrics map from top-papers API
        const perfMap = new Map<string, { attempts: number; revenue: number; formatted: string; price?: number; duration?: number }>();
        if (topPapersRes.status === 'fulfilled' && topPapersRes.value.ok) {
          const topData = await topPapersRes.value.json();
          if (topData.top_performing_papers && Array.isArray(topData.top_performing_papers)) {
            topData.top_performing_papers.forEach((p: any) => {
              if (p.paper_name) {
                perfMap.set(p.paper_name.toLowerCase(), {
                  attempts: p.attempts_count || 0,
                  revenue: p.gross_revenue || 0,
                  formatted: p.revenue_formatted || (p.gross_revenue ? `₹${p.gross_revenue.toLocaleString('en-IN')}` : '₹0'),
                  price: p.price ?? p.listing_price,
                  duration: p.duration ?? p.duration_mins
                });
              }
            });
          }
        }

        // Enrich papers with exact values from DB
        const enriched = papersList.map(paper => {
          const perf = perfMap.get(paper.paper_name.toLowerCase());
          const totalQ = paper.total_questions ?? paper.questions_count ?? 90;

          // Priority: paper.price from DB -> perf.price -> 150 default only if totally missing
          const resolvedPrice =
            paper.price !== undefined && paper.price !== null
              ? Number(paper.price)
              : perf?.price !== undefined && perf?.price !== null
              ? Number(perf.price)
              : 150;

          // Priority: paper.duration / duration_mins from DB -> perf.duration -> fallback based on questions count
          const resolvedDuration =
            paper.duration !== undefined && paper.duration !== null
              ? Number(paper.duration)
              : paper.duration_mins !== undefined && paper.duration_mins !== null
              ? Number(paper.duration_mins)
              : perf?.duration !== undefined && perf?.duration !== null
              ? Number(perf.duration)
              : totalQ > 50 ? 180 : 90;

          return {
            ...paper,
            display_title: formatPaperTitle(paper.paper_name),
            price: resolvedPrice,
            duration: resolvedDuration,
            duration_mins: resolvedDuration,
            attempts_count: perf?.attempts || 0,
            gross_revenue: perf?.revenue || 0,
            revenue_formatted: perf?.formatted || (perf && perf.revenue > 0 ? `₹${perf.revenue.toLocaleString('en-IN')}` : undefined)
          };
        });

        setApiPapers(enriched);
      } catch (err) {
        console.error('Failed to fetch papers:', err);
        addToast('Failed to load exam papers', 'error');
      } finally {
        setLoadingPapers(false);
        fetchingRef.current = false;
      }
    };

    fetchAllPapersData();
  }, [addToast]);

  // Handle Sort Change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (paper: ExamPaperItem) => {
    const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
    if (stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' && stateNorm !== 'MANUAL-VERIFIED') {
      addToast('Paper must be verified and completed before publishing to marketplace', 'warning');
      return;
    }

    const token = localStorage.getItem('auth_token');
    const newStatus = !paper.is_active;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(
        `${apiUrl}/api/exam-paper/${encodeURIComponent(paper.paper_name)}/status?is_active=${newStatus}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        setApiPapers(prev =>
          prev.map(p => (p.paper_name === paper.paper_name ? { ...p, is_active: newStatus } : p))
        );
        addToast(`Paper ${newStatus ? 'published live to' : 'unlisted from'} marketplace`, 'success');
      } else {
        addToast('Failed to update paper active status', 'error');
      }
    } catch {
      addToast('Error updating paper status', 'error');
    }
  };

  // Open Quick Edit Modal
  const openQuickEdit = (paper: ExamPaperItem) => {
    setEditingPaper(paper);
    setEditTitle(paper.display_title || formatPaperTitle(paper.paper_name));
    setEditPrice(paper.price !== undefined && paper.price !== null ? Number(paper.price) : 150);
    setEditDuration(
      paper.duration !== undefined && paper.duration !== null
        ? Number(paper.duration)
        : paper.duration_mins !== undefined && paper.duration_mins !== null
        ? Number(paper.duration_mins)
        : 180
    );
    setEditIsActive(Boolean(paper.is_active));
    setOpenMenuPaper(null);
  };

  // Save Quick Edit Modal
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaper) return;

    setSavingEdit(true);
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      // 1. Update paper duration, price, total_questions on backend
      const totalQ = editingPaper.total_questions ?? editingPaper.questions_count ?? 90;
      await fetch(
        `${apiUrl}/api/update-exam-paper/${encodeURIComponent(editingPaper.paper_name)}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            duration: Number(editDuration),
            price: Number(editPrice),
            total_questions: totalQ
          })
        }
      );

      // 2. If active status changed, trigger status patch
      if (editIsActive !== editingPaper.is_active) {
        await fetch(
          `${apiUrl}/api/exam-paper/${encodeURIComponent(editingPaper.paper_name)}/status?is_active=${editIsActive}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      // Update local state
      setApiPapers(prev =>
        prev.map(p =>
          p.paper_name === editingPaper.paper_name
            ? {
                ...p,
                display_title: editTitle,
                price: Number(editPrice),
                duration: Number(editDuration),
                duration_mins: Number(editDuration),
                is_active: editIsActive
              }
            : p
        )
      );

      addToast(`Updated settings for "${editTitle}"`, 'success');
      setEditingPaper(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to save paper settings', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtered & Sorted Papers
  const processedPapers = useMemo(() => {
    let result = apiPapers.filter(paper => {
      // Hide original completed papers if needed
      if (paper.type === 'Original' && (paper.state || '').toUpperCase() === 'COMPLETED') {
        return false;
      }

      // Tab filter
      const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
      if (activeTab === 'ACTIVE') {
        return paper.is_active === true;
      }
      if (activeTab === 'REVIEW') {
        return stateNorm === 'AI-PROCESSED' || stateNorm === 'SANDBOX-REVIEW' || stateNorm === 'MANUALLY-CREATED';
      }
      if (activeTab === 'DRAFTS') {
        return !paper.is_active && stateNorm !== 'COMPLETED';
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (paper.display_title || '').toLowerCase().includes(query);
        const nameMatch = paper.paper_name.toLowerCase().includes(query);
        const codeMatch = (paper.exam_code || '').toLowerCase().includes(query);
        const yearMatch = (paper.year_and_shift || '').toLowerCase().includes(query);
        return titleMatch || nameMatch || codeMatch || yearMatch;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = (a.display_title || a.paper_name).localeCompare(b.display_title || b.paper_name);
          break;
        case 'category':
          comparison = (a.exam_code || '').localeCompare(b.exam_code || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'attempts':
          comparison = (a.attempts_count || 0) - (b.attempts_count || 0);
          break;
        case 'revenue':
          comparison = (a.gross_revenue || 0) - (b.gross_revenue || 0);
          break;
        case 'date':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'status':
          comparison = (a.state || '').localeCompare(b.state || '');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [apiPapers, activeTab, searchQuery, sortField, sortDirection]);

  // Overall Storefront Metrics
  const totalPapersCount = apiPapers.length;
  const activeMarketplaceCount = apiPapers.filter(p => p.is_active).length;
  const totalAttemptsSum = apiPapers.reduce((sum, p) => sum + (p.attempts_count || 0), 0);
  const totalEarnedSum = apiPapers.reduce((sum, p) => sum + (p.gross_revenue || 0), 0);

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto pb-16 flex flex-col">
      {/* ============================================================ */}
      {/* Storefront Header & Primary CTA                             */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Storefront Manager
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-[#003fb1] dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs rounded-full">
              {totalPapersCount} Papers
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your exam catalog, monitor student attempt volume, listing prices, and monetization status.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload_pdf')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003fb1] hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all shrink-0"
        >
          <FileText className="w-4 h-4" />
          + Create & Upload New Exam Paper
        </button>
      </div>

      {/* ============================================================ */}
      {/* Metric Quick Glance Cards                                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4.5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Total Catalog
          </p>
          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {totalPapersCount}
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">All uploaded papers</span>
        </div>

        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4.5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Live in Storefront
          </p>
          <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeMarketplaceCount}
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Published & selling</span>
        </div>

        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4.5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Total Attempts
          </p>
          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {totalAttemptsSum.toLocaleString('en-IN')}
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Student conversions</span>
        </div>

        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4.5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Catalog Gross
          </p>
          <h4 className="text-2xl font-extrabold text-[#003fb1] dark:text-blue-400 mt-1">
            ₹{totalEarnedSum.toLocaleString('en-IN')}
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">From all paper sales</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Filter Tabs & Search Bar                                    */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-3 shadow-sm">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Papers' },
              { id: 'ACTIVE', label: 'Live in Marketplace' },
              { id: 'REVIEW', label: 'Needs Review' },
              { id: 'DRAFTS', label: 'Drafts' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                addToast(`Filtered by ${tab.label}`, 'info');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#003fb1] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2d3446]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search papers by title or exam..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Storefront Data Table                                        */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors" ref={menuRef}>
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-[#1e2330] flex flex-wrap gap-2 items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Storefront Catalog Table
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {processedPapers.length} of {apiPapers.length} items
          </span>
        </div>

        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#1e2330] border-b border-slate-200 dark:border-slate-700/70 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                {/* 1. Paper Details */}
                <th
                  onClick={() => handleSort('title')}
                  className="p-4 cursor-pointer hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Paper Details</span>
                    {sortField === 'title' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#003fb1]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#003fb1]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 2. Category */}
                <th
                  onClick={() => handleSort('category')}
                  className="p-4 cursor-pointer hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {sortField === 'category' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#003fb1]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#003fb1]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 3. Price */}
                <th
                  onClick={() => handleSort('price')}
                  className="p-4 cursor-pointer hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Price</span>
                    {sortField === 'price' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#003fb1]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#003fb1]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 4. Performance */}
                <th
                  onClick={() => handleSort('attempts')}
                  className="p-4 cursor-pointer hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Performance</span>
                    {sortField === 'attempts' || sortField === 'revenue' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#003fb1]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#003fb1]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 5. Status & Upload Date */}
                <th
                  onClick={() => handleSort('status')}
                  className="p-4 cursor-pointer hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status & Date</span>
                    {sortField === 'status' || sortField === 'date' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#003fb1]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#003fb1]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 6. Active Toggle */}
                <th className="p-4 text-center">Active</th>

                {/* 7. Action Menu */}
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700/60">
              {loadingPapers ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-3 border-[#003fb1] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold">Loading storefront catalog...</p>
                    </div>
                  </td>
                </tr>
              ) : processedPapers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No exam papers found</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">
                        {searchQuery
                          ? `No matches for "${searchQuery}". Try a different keyword.`
                          : 'You have not uploaded any exam sheets yet. Click below to add your first paper.'}
                      </p>
                      <button
                        onClick={() => navigate('/upload_pdf')}
                        className="mt-2 px-4 py-2 bg-[#003fb1] text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-all"
                      >
                        + Upload Exam Paper
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedPapers.map((paper, idx) => {
                  const stateNorm = (paper.state || '').toUpperCase().replace(/_/g, '-');
                  const totalQ = paper.total_questions || paper.questions_count || 90;
                  const durationM =
                    paper.duration !== undefined && paper.duration !== null
                      ? paper.duration
                      : paper.duration_mins !== undefined && paper.duration_mins !== null
                      ? paper.duration_mins
                      : totalQ > 50 ? 180 : 90;
                  const titleDisplay = paper.display_title || formatPaperTitle(paper.paper_name);
                  const uploadDateStr = formatUploadedDate(paper.created_at);

                  // Primary Workflow Action handler
                  let primaryActionLabel = 'Open';
                  let primaryActionHandler = () => {
                    navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`);
                    addToast(`Opening ${titleDisplay}`, 'info');
                  };

                  if (stateNorm === 'AI-PROCESSED') {
                    primaryActionLabel = 'Manual Verification';
                    primaryActionHandler = () => {
                      navigate(
                        `/verification?paper=${encodeURIComponent(paper.paper_name)}&state=${encodeURIComponent(paper.state)}`
                      );
                      addToast(`Opening Verification workdesk for ${titleDisplay}`, 'info');
                    };
                  } else if (stateNorm === 'MANUALLY-VERIFIED' || stateNorm === 'MANUAL-VERIFIED') {
                    if (paper.type === 'Manually-Uploaded') {
                      primaryActionLabel = 'Review';
                      primaryActionHandler = () => {
                        navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`);
                        addToast(`Opening Review for ${titleDisplay}`, 'info');
                      };
                    } else {
                      primaryActionLabel = 'Generate Variant';
                      primaryActionHandler = () => {
                        navigate(
                          `/variant_gen?paper=${encodeURIComponent(paper.paper_name)}&state=${encodeURIComponent(paper.state)}`
                        );
                        addToast(`Opening Variant Gen for ${titleDisplay}`, 'info');
                      };
                    }
                  } else if (
                    stateNorm === 'SANDBOX-VERIFIED' ||
                    stateNorm === 'SANDBOX-SKIPPED' ||
                    stateNorm === 'MANUALLY-CREATED' ||
                    stateNorm === 'SANDBOX-REVIEW'
                  ) {
                    if (
                      (paper.type === 'Manually-Uploaded' || stateNorm === 'MANUALLY-CREATED') &&
                      (paper.questions_count || 0) < totalQ
                    ) {
                      primaryActionLabel = 'Add Questions';
                      primaryActionHandler = () => {
                        navigate(
                          `/manual_entry?paperName=${encodeURIComponent(paper.paper_name)}&examCode=${encodeURIComponent(
                            paper.exam_code || ''
                          )}&totalQuestions=${totalQ}&yearAndShift=${encodeURIComponent(
                            paper.year_and_shift || ''
                          )}&questionsCount=${paper.questions_count || 0}`
                        );
                      };
                    } else {
                      primaryActionLabel = 'Review';
                      primaryActionHandler = () => {
                        navigate(`/review?paper=${encodeURIComponent(paper.paper_name)}`);
                        addToast(`Opening Review for ${titleDisplay}`, 'info');
                      };
                    }
                  }

                  const isMenuOpen = openMenuPaper === paper.paper_name;

                  return (
                    <tr
                      key={paper.paper_name || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#2d3446]/60 transition-colors group"
                    >
                      {/* 1. Paper Details */}
                      <td className="p-4 min-w-[280px]">
                        <div className="space-y-1">
                          <p
                            onClick={() => openQuickEdit(paper)}
                            className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#003fb1] dark:group-hover:text-blue-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                            title={`Raw: ${paper.paper_name}`}
                          >
                            {titleDisplay}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400" />
                              {totalQ} Qs
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {durationM} Mins
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category Tag */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase tracking-wide border ${
                            (paper.exam_code || '').toUpperCase().includes('ADV')
                              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/80'
                              : (paper.exam_code || '').toUpperCase().includes('MAIN')
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80'
                              : (paper.exam_code || '').toUpperCase().includes('NEET')
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                              : 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/80'
                          }`}
                        >
                          {paper.exam_code || 'EXAM'}
                        </span>
                      </td>

                      {/* 3. Price */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => openQuickEdit(paper)}
                          className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-[#003fb1] dark:hover:text-blue-400 transition-colors flex items-center gap-0.5 group/price"
                          title="Click to edit price"
                        >
                          <span>₹{paper.price !== undefined && paper.price !== null ? paper.price : 0}</span>
                          <Edit3 className="w-3 h-3 opacity-0 group-hover/price:opacity-100 text-slate-400 transition-opacity ml-1" />
                        </button>
                      </td>

                      {/* 4. Performance (Dual-Line: Attempts & Earned) */}
                      <td className="p-4 whitespace-nowrap">
                        {(paper.attempts_count || 0) > 0 || (paper.gross_revenue || 0) > 0 ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <span>{(paper.attempts_count || 0).toLocaleString('en-IN')} Attempts</span>
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {paper.revenue_formatted || `₹${(paper.gross_revenue || 0).toLocaleString('en-IN')}`} Earned
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-bold text-sm tracking-wider">
                            —
                          </span>
                        )}
                      </td>

                      {/* 5. Status & Upload Date (Dual-Line Formatting) */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                stateNorm === 'VERIFIED' ||
                                stateNorm === 'MANUALLY-VERIFIED' ||
                                stateNorm === 'MANUAL-VERIFIED' ||
                                stateNorm === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80'
                                  : stateNorm === 'AI-PROCESSED' ||
                                    stateNorm === 'SANDBOX-VERIFIED' ||
                                    stateNorm === 'SANDBOX-SKIPPED' ||
                                    stateNorm === 'SANDBOX-REVIEW'
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/80'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
                              }`}
                            >
                              {(stateNorm === 'VERIFIED' ||
                                stateNorm === 'MANUALLY-VERIFIED' ||
                                stateNorm === 'MANUAL-VERIFIED' ||
                                stateNorm === 'COMPLETED') && <Check className="w-3 h-3" />}
                              {(stateNorm === 'AI-PROCESSED' || stateNorm === 'SANDBOX-REVIEW') && (
                                <Sparkles className="w-3 h-3" />
                              )}
                              {(stateNorm === 'PENDING' || !stateNorm) && (
                                <RotateCw className="w-3 h-3 animate-spin" />
                              )}
                              {paper.state || 'PENDING'}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                            {uploadDateStr}
                          </p>
                        </div>
                      </td>

                      {/* 6. Active Toggle Switch */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <label
                            className={`relative inline-flex items-center ${
                              stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' && stateNorm !== 'MANUAL-VERIFIED'
                                ? 'cursor-not-allowed opacity-40'
                                : 'cursor-pointer'
                            }`}
                            title={
                              stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' && stateNorm !== 'MANUAL-VERIFIED'
                                ? 'Complete review & verification before publishing to storefront'
                                : 'Toggle marketplace visibility'
                            }
                          >
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={paper.is_active || false}
                              onChange={() => handleToggleActive(paper)}
                              disabled={
                                stateNorm !== 'COMPLETED' && stateNorm !== 'DONE' && stateNorm !== 'MANUAL-VERIFIED'
                              }
                            />
                            <div className="w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-600 bg-slate-300 dark:bg-slate-700 peer-checked:bg-[#003fb1] dark:peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                          </label>
                        </div>
                      </td>

                      {/* 7. Action: Three-Dot Dropdown Menu */}
                      <td className="p-4 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={primaryActionHandler}
                            className="hidden sm:inline-flex text-xs font-semibold text-[#003fb1] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg transition-all"
                          >
                            {primaryActionLabel}
                          </button>

                          <div className="relative">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setOpenMenuPaper(isMenuOpen ? null : paper.paper_name);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2d3446] text-slate-500 dark:text-slate-400 transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 py-1.5 text-left divide-y divide-slate-100 dark:divide-slate-700/60"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      primaryActionHandler();
                                      setOpenMenuPaper(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252b3b] flex items-center gap-2"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#003fb1] dark:text-blue-400" />
                                    {primaryActionLabel} Workdesk
                                  </button>
                                  <button
                                    onClick={() => openQuickEdit(paper)}
                                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252b3b] flex items-center gap-2"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    Quick Edit Listing
                                  </button>
                                </div>

                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleToggleActive(paper);
                                      setOpenMenuPaper(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#252b3b] flex items-center gap-2"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                                    {paper.is_active ? 'Unlist Paper' : 'Publish Live'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/70 flex justify-between items-center bg-slate-50/30 dark:bg-[#1e2330]">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing {processedPapers.length} active documents
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/upload_pdf')}
              className="text-xs font-bold text-[#003fb1] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              + Upload More Papers
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Quick Edit Modal                                             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {editingPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#003fb1] dark:text-blue-400 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Quick Edit Storefront Listing
                  </h3>
                </div>
                <button
                  onClick={() => setEditingPaper(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveQuickEdit} className="space-y-4">
                {/* 1. Display Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Marketplace Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="e.g. JEE Advanced 2026 Full Physics Mock #01"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Clean, human-readable titles improve student conversion rates.
                  </p>
                </div>

                {/* 2. Listing Price & Time Limit (Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Price (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        required
                        value={editPrice}
                        onChange={e => setEditPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Time Limit (Mins)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      required
                      value={editDuration}
                      onChange={e => setEditDuration(Math.max(15, parseInt(e.target.value) || 180))}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>

                {/* 3. Visibility Toggle */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Marketplace Visibility
                    </p>
                    <p className="text-[11px] text-slate-400">
                      When active, students can discover and purchase this exam paper.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={editIsActive}
                      onChange={e => setEditIsActive(e.target.checked)}
                    />
                    <div className="w-10 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 bg-slate-300 dark:bg-slate-700 peer-checked:bg-[#003fb1] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPaper(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e2330] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-[#003fb1] hover:bg-blue-800 dark:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {savingEdit ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

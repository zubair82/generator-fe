import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Wallet,
  Clock,
  Users,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Share2,
  Globe,
  Network,
  Activity,
  ArrowRight,
  BarChart3,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

interface LiveFeedItem {
  id: string | number;
  student_id?: string;
  student_initials?: string;
  student_name?: string;
  action_text?: string;
  paper_id?: string | number;
  paper_name?: string;
  paper_title?: string;
  exam_code?: string;
  score?: string;
  marks_obtained?: number;
  total_marks?: number;
  tier_badge?: string;
  tier_type?: 'direct' | 'marketplace' | 'network' | string;
  time_ago?: string;
}

interface TopPerformingPaper {
  rank?: number;
  paper_id: string | number;
  paper_name?: string;
  title: string;
  exam_code: string;
  attempts_count: number;
  attempts_label: string;
  completion_rate: number;
  completion_label: string;
  gross_revenue: number;
  gross_revenue_inr?: number;
  gross_revenue_paise?: number;
  revenue_formatted: string;
  students_count?: number;
  is_active?: boolean;
  created_at?: string;
}

interface TopPaper {
  id: string;
  name: string;
  examCode: string;
  attempts: number;
  grossRevenue: string;
  completionRate: string;
}

interface StudentActivity {
  id: string;
  initials: string;
  studentName: string;
  paperName: string;
  score: string;
  source: 'Direct' | 'Marketplace' | 'Network';
  sourcePct: string;
  timeAgo: string;
}

interface EarningsSummaryResponse {
  success: boolean;
  teacher_id?: string;
  summary?: {
    total_net_earnings?: {
      amount?: number;
      amount_inr?: number;
      amount_paise?: number;
      formatted?: string;
      growth_percentage?: number;
      growth_label?: string;
      currency?: string;
    };
    pending_payout?: {
      amount?: number;
      amount_inr?: number;
      amount_paise?: number;
      formatted?: string;
      unpaid_count?: number;
      payout_schedule?: string;
      currency?: string;
    };
    total_test_attempts?: {
      count?: number;
      formatted?: string;
      subtitle?: string;
    };
    active_exam_papers?: {
      count?: number;
      formatted?: string;
      total_papers?: number;
      drafts_count?: number;
      drafts_label?: string;
    };
  };
  attribution_matrix?: {
    direct_referral?: {
      tier?: string;
      percentage?: number;
      tier_label?: string;
      tag?: string;
      title?: string;
      description?: string;
      amount?: number;
      amount_inr?: number;
      amount_paise?: number;
      formatted?: string;
      students_count?: number;
      students_label?: string;
      traffic_label?: string;
    };
    marketplace?: {
      tier?: string;
      percentage?: number;
      tier_label?: string;
      tag?: string;
      title?: string;
      description?: string;
      amount?: number;
      amount_inr?: number;
      amount_paise?: number;
      formatted?: string;
      students_count?: number;
      students_label?: string;
      traffic_label?: string;
    };
    network_affiliate?: {
      tier?: string;
      percentage?: number;
      tier_label?: string;
      tag?: string;
      title?: string;
      description?: string;
      amount?: number;
      amount_inr?: number;
      amount_paise?: number;
      formatted?: string;
      students_count?: number;
      students_label?: string;
      traffic_label?: string;
    };
  };
  top_papers?: TopPaper[];
  recent_activities?: StudentActivity[];
}

export function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('TCHR-98241');
  const [earningsData, setEarningsData] = useState<EarningsSummaryResponse | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState<boolean>(true);
  const [topPerformingPapers, setTopPerformingPapers] = useState<TopPerformingPaper[]>([]);
  const [loadingTopPapers, setLoadingTopPapers] = useState<boolean>(true);
  const [liveFeedItems, setLiveFeedItems] = useState<LiveFeedItem[]>([]);
  const [loadingLiveFeed, setLoadingLiveFeed] = useState<boolean>(true);

  const hasFetchedRef = useRef(false);

  // Compute clean teacher slug without triggering re-fetches
  const teacherSlug = useMemo(() => {
    const namePart = (user?.name || user?.email?.split('@')[0] || 'educator')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return namePart || 'academy';
  }, [user?.name, user?.email]);

  // Helper to format currency
  const formatINR = (val: number | string | undefined, defaultVal: string = '₹0'): string => {
    if (val === undefined || val === null) return defaultVal;
    if (typeof val === 'string' && val.startsWith('₹')) return val;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return defaultVal;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Fetch all dashboard data exactly once on mount
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoadingEarnings(false);
      setLoadingTopPapers(false);
      setLoadingLiveFeed(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:5001';
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Earnings summary
    fetch(`${apiUrl}/api/v1/earnings/summary`, { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) setEarningsData(data);
      })
      .catch(err => console.error('Failed to load earnings summary from API:', err))
      .finally(() => setLoadingEarnings(false));

    // 2. Top performing papers
    fetch(`${apiUrl}/api/v1/earnings/top-papers?limit=5`, { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.top_performing_papers && Array.isArray(data.top_performing_papers)) {
          setTopPerformingPapers(data.top_performing_papers);
        }
      })
      .catch(err => console.error('Failed to load top performing papers from API:', err))
      .finally(() => setLoadingTopPapers(false));

    // 3. Live student feed
    fetch(`${apiUrl}/api/v1/earnings/live-feed?limit=10`, { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.feed && Array.isArray(data.feed)) {
          setLiveFeedItems(data.feed);
        }
      })
      .catch(err => console.error('Failed to load live student feed from API:', err))
      .finally(() => setLoadingLiveFeed(false));

    // 4. Teacher details / referral code
    fetch(`${authUrl}/api/v1/teacher/details/me`, { headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.referral_code) {
          setReferralCode(data.referral_code);
        }
      })
      .catch(err => console.error('Failed to load teacher details:', err));
  }, []);

  const referralUrl = `https://examsimula.com/academy/${teacherSlug}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    addToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Top Performing Papers Data (Live strictly from API)
  const topPapers: TopPaper[] = topPerformingPapers.map((p, idx) => ({
    id: String(p.paper_id || idx + 1),
    name: p.title || p.paper_name || `Exam Paper #${p.paper_id}`,
    examCode: p.exam_code || 'EXAM',
    attempts: p.attempts_count || 0,
    grossRevenue: p.revenue_formatted || formatINR(p.gross_revenue, '₹0'),
    completionRate: p.completion_label || `${Math.round(p.completion_rate || 0)}%`
  }));

  return (
    <div className="space-y-8 flex-1 w-full max-w-7xl mx-auto pb-16">
      {/* ============================================================ */}
      {/* ZONE 1: Greeting & Referral Quick-Share Bar                 */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* Header Greeting */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {user?.name || 'Educator'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your platform monetization overview.
          </p>
        </div>

        {/* Identity & Referral Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 dark:bg-blue-950/70 text-[#003fb1] dark:text-blue-400 rounded-lg">
                  <Share2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Your Academy Referral Link
                </span>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/70 text-[#003fb1] dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 font-semibold text-[10px] rounded-full uppercase">
                  70% Direct Revenue
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste this link in your YouTube descriptions and pinned comments to lock in direct conversions.
              </p>
            </div>

            {/* Live Student Preview Link */}
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003fb1] dark:text-blue-400 hover:underline shrink-0"
            >
              Preview Student View
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Read-Only Input & Copy Action Button */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={referralUrl}
                placeholder="https://examsimula.com/academy/..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400 select-all focus:outline-none focus:ring-2 focus:ring-[#003fb1] dark:focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={handleCopyLink}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#003fb1] hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-blue-900/10'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* ZONE 2: Primary Financial Cards (Top-Row KPI Grid)          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Net Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 border-l-4 border-l-[#003fb1] dark:border-l-blue-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Net Earnings
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {earningsData?.summary?.total_net_earnings?.formatted ||
                  (earningsData?.summary?.total_net_earnings?.amount_inr !== undefined
                    ? formatINR(earningsData.summary.total_net_earnings.amount_inr)
                    : '₹0')}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/70 text-[#003fb1] dark:text-blue-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`font-bold flex items-center gap-0.5 ${
              (earningsData?.summary?.total_net_earnings?.growth_percentage ?? 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {earningsData?.summary?.total_net_earnings?.growth_label || '+0% from last month'}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Pending Payout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Pending Payout
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {earningsData?.summary?.pending_payout?.formatted ||
                  (earningsData?.summary?.pending_payout?.amount_inr !== undefined
                    ? formatINR(earningsData.summary.pending_payout.amount_inr)
                    : '₹0')}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Next payout: <strong className="text-slate-700 dark:text-slate-200">{earningsData?.summary?.pending_payout?.payout_schedule || '1st of month'}</strong>
            </span>
            <button
              onClick={() => addToast('Automatic payout scheduled via Razorpay Route.', 'info')}
              className="text-[#003fb1] dark:text-blue-400 font-bold hover:underline"
            >
              Withdraw Funds
            </button>
          </div>
        </motion.div>

        {/* Card 3: Total Test Attempts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Test Attempts
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {earningsData?.summary?.total_test_attempts?.formatted ||
                  (earningsData?.summary?.total_test_attempts?.count !== undefined
                    ? earningsData.summary.total_test_attempts.count.toLocaleString('en-IN')
                    : '0')}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
            {earningsData?.summary?.total_test_attempts?.subtitle || 'Across all active papers'}
          </div>
        </motion.div>

        {/* Card 4: Active Exam Papers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Active Exam Papers
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {earningsData?.summary?.active_exam_papers?.formatted ||
                  (earningsData?.summary?.active_exam_papers?.count !== undefined
                    ? String(earningsData.summary.active_exam_papers.count)
                    : '0')}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {earningsData?.summary?.active_exam_papers?.drafts_label ||
                (earningsData?.summary?.active_exam_papers?.drafts_count !== undefined
                  ? `${earningsData.summary.active_exam_papers.drafts_count} drafts in review`
                  : '0 drafts in review')}
            </span>
            <button
              onClick={() => navigate('/papers')}
              className="text-[#003fb1] dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
            >
              View Papers <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* ZONE 3: The Attribution Matrix (Three-Stream Breakdown)     */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#003fb1] dark:text-blue-400" />
            The Attribution Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Granular breakdown of your 70%, 50%, and 20% revenue engines across your audience and the network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stream 1: Direct Referral Sales (70%) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              navigate('/students?tier=direct');
              addToast('Loaded Direct Referral Student Roster', 'info');
            }}
            className="group cursor-pointer bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 font-bold text-xs rounded-full uppercase tracking-wide">
                  {earningsData?.attribution_matrix?.direct_referral?.tier_label || '70% CUT'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                  {earningsData?.attribution_matrix?.direct_referral?.tag || 'YOUR AUDIENCE'} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {earningsData?.attribution_matrix?.direct_referral?.title || 'Direct Referral Sales'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {earningsData?.attribution_matrix?.direct_referral?.description ||
                  'Reinforces that pushing your custom YouTube link delivers maximum creator margin.'}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {earningsData?.attribution_matrix?.direct_referral?.formatted ||
                      formatINR(earningsData?.attribution_matrix?.direct_referral?.amount_inr, '₹0')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {earningsData?.attribution_matrix?.direct_referral?.students_label ||
                      (earningsData?.attribution_matrix?.direct_referral?.students_count !== undefined
                        ? `${earningsData.attribution_matrix.direct_referral.students_count} students`
                        : '0 students')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1a1e29] h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-[#003fb1] dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((earningsData?.attribution_matrix?.direct_referral?.students_count ?? 0) / 250) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
              <span>{earningsData?.attribution_matrix?.direct_referral?.traffic_label || 'Primary channel traffic'}</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                View Roster →
              </span>
            </div>
          </motion.div>

          {/* Stream 2: Marketplace Sales (50%) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => {
              navigate('/students?tier=organic');
              addToast('Loaded Organic Marketplace Student Roster', 'info');
            }}
            className="group cursor-pointer bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold text-xs rounded-full uppercase tracking-wide">
                  {earningsData?.attribution_matrix?.marketplace?.tier_label || '50% CUT'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  {earningsData?.attribution_matrix?.marketplace?.tag || 'PLATFORM DISCOVERY'} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {earningsData?.attribution_matrix?.marketplace?.title || 'Marketplace Sales'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {earningsData?.attribution_matrix?.marketplace?.description ||
                  'Passive income generated by ExamSimula\'s organic SEO directory without any creator effort.'}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {earningsData?.attribution_matrix?.marketplace?.formatted ||
                      formatINR(earningsData?.attribution_matrix?.marketplace?.amount_inr, '₹0')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {earningsData?.attribution_matrix?.marketplace?.students_label ||
                      (earningsData?.attribution_matrix?.marketplace?.students_count !== undefined
                        ? `${earningsData.attribution_matrix.marketplace.students_count} students`
                        : '0 students')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1a1e29] h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((earningsData?.attribution_matrix?.marketplace?.students_count ?? 0) / 250) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
              <span>{earningsData?.attribution_matrix?.marketplace?.traffic_label || 'Organic ExamSimula Search'}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                View Roster →
              </span>
            </div>
          </motion.div>

          {/* Stream 3: Network Affiliate Sales (20%) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              navigate('/students?tier=network');
              addToast('Loaded Network Affiliate Student Roster', 'info');
            }}
            className="group cursor-pointer bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 font-bold text-xs rounded-full uppercase tracking-wide">
                  {earningsData?.attribution_matrix?.network_affiliate?.tier_label || '20% CUT'}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1">
                  {earningsData?.attribution_matrix?.network_affiliate?.tag || 'CROSS-POLLINATION'} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {earningsData?.attribution_matrix?.network_affiliate?.title || 'Network Affiliate Sales'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {earningsData?.attribution_matrix?.network_affiliate?.description ||
                  'Rewards you whenever your referred students buy another creator\'s subject mock tests.'}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {earningsData?.attribution_matrix?.network_affiliate?.formatted ||
                      formatINR(earningsData?.attribution_matrix?.network_affiliate?.amount_inr, '₹0')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {earningsData?.attribution_matrix?.network_affiliate?.students_label ||
                      (earningsData?.attribution_matrix?.network_affiliate?.students_count !== undefined
                        ? `${earningsData.attribution_matrix.network_affiliate.students_count} students`
                        : '0 students')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#1a1e29] h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((earningsData?.attribution_matrix?.network_affiliate?.students_count ?? 0) / 250) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400">
              <span>{earningsData?.attribution_matrix?.network_affiliate?.traffic_label || 'Ecosystem cross-sales'}</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400 group-hover:underline flex items-center gap-0.5">
                View Roster →
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ZONE 4: Operational Data & Recent Activity (Split Layout)   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Top Performing Papers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-colors"
        >
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between bg-slate-50/50 dark:bg-[#1e2330]">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Top Performing Papers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by total student volume and gross revenue</p>
              </div>

              <button
                onClick={() => navigate('/papers')}
                className="text-xs font-bold text-[#003fb1] dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                All Papers <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {topPapers.length > 0 ? (
                topPapers.map((paper, idx) => (
                  <div
                    key={paper.id}
                    className="p-4.5 hover:bg-slate-50/80 dark:hover:bg-[#2d3446]/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#1a1e29] text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {paper.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#1a1e29] text-slate-600 dark:text-slate-300 font-semibold text-[10px] rounded uppercase">
                            {paper.examCode}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {paper.attempts} attempts
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {paper.completionRate} completion
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                        {paper.grossRevenue}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No exam papers created yet. Upload a paper to track performance!
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#1e2330] border-t border-slate-100 dark:border-slate-700/70 text-center">
            <button
              onClick={() => navigate('/upload_pdf')}
              className="text-xs font-bold text-[#003fb1] dark:text-blue-400 hover:underline"
            >
              + Create & Upload New Exam Paper
            </button>
          </div>
        </motion.div>

        {/* Right Column (5 cols): Live Student Feed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-5 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden transition-colors"
        >
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between bg-slate-50/50 dark:bg-[#1e2330]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Live Student Feed</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Real-Time
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {liveFeedItems.length > 0 ? (
                liveFeedItems.map((act) => {
                  const initials = act.student_initials || 'S.U.';
                  const studentName = act.student_name || 'Student';
                  const actionText = act.action_text || 'completed';
                  const paperTitle = act.paper_title || act.paper_name || 'Exam Paper';
                  const tierBadge = act.tier_badge || 'Direct (70%)';
                  const tierType = act.tier_type || 'direct';
                  const timeAgo = act.time_ago || 'just now';
                  const rawScore = act.score || `${Math.round(act.marks_obtained || 0)}/${Math.round(act.total_marks || 100)}`;
                  const scoreVal = rawScore.replace(/^Score:\s*/i, '');

                  return (
                    <div key={act.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-[#2d3446]/60 transition-colors space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 w-8">
                            {initials}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {studentName}{' '}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {actionText}
                            </span>
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border shrink-0 ${
                          tierType === 'direct' || tierBadge.toLowerCase().includes('direct') || tierBadge.includes('70%')
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                            : tierType === 'marketplace' || tierBadge.toLowerCase().includes('marketplace') || tierBadge.includes('50%')
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {tierBadge}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate pl-10">
                        {paperTitle}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 pl-10 pt-0.5">
                        <span>Score: <strong className="text-slate-800 dark:text-slate-100 font-bold">{scoreVal}</strong></span>
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No student attempts recorded yet. Live student activity will appear here in real-time.
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 bg-slate-50 dark:bg-[#1e2330] border-t border-slate-100 dark:border-slate-700/70 text-center">
            <button
              onClick={() => {
                navigate('/students');
                addToast('Loaded Student Roster', 'info');
              }}
              className="text-xs font-bold text-[#003fb1] dark:text-blue-400 hover:underline flex items-center justify-center gap-1 w-full"
            >
              View Full Student Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

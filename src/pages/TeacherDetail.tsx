import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  FileText,
  IndianRupee,
  Network,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  Wallet,
  Calendar,
  Image as ImageIcon,
  Sliders,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Percent,
  Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

// Core Identity, Financials, and Volume Schemas from GET /api/v1/admin/teachers/{teacher_id}
export interface AttributionTier {
  revenue: number;
  student_count: number;
}

export interface TeacherCoreData {
  identity: {
    teacher_id: string;
    name: string;
    email: string;
    institute_name: string;
    referral_code?: string | null;
    status: string;
    joined_at?: string | null;
    phone?: string | null;
    upi_id?: string | null;
    bio?: string | null;
    banner_path?: string | null;
    revenue_share_pct?: number;
  };
  financials: {
    total_net_earnings: number;
    pending_payout: number;
    last_payout_date?: string | null;
    attribution: {
      direct_referral: AttributionTier;
      marketplace: AttributionTier;
      network_affiliate: AttributionTier;
    };
  };
  volume: {
    active_papers: number;
    draft_papers: number;
    total_test_attempts: number;
    roster_count: number;
  };
}

// Deep-Dive Tab Schemas
export interface PaperTabItem {
  paper_id: number;
  name: string;
  status: string;
  attempt_count: number;
  revenue_generated: number;
  created_at?: string | null;
}

export interface StudentTabItem {
  student_id: string;
  name: string;
  email?: string | null;
  tests_taken: number;
  avg_accuracy: number;
  joined_via: string;
}

export interface PayoutTabItem {
  payout_id: string;
  amount: number;
  status: string;
  transaction_ref?: string | null;
  date?: string | null;
}

export interface PaginationMeta {
  current_page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useUI();

  // Tab State: papers (default so authored papers render on load), overview, students, payouts, branding
  const [activeTab, setActiveTab] = useState<'overview' | 'papers' | 'students' | 'payouts' | 'branding'>('papers');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pagination states for deep-dive tabs
  const [papersPage, setPapersPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);

  // Quick Action Modal states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [commissionOverrideInput, setCommissionOverrideInput] = useState<number>(70);
  const [commissionReason, setCommissionReason] = useState('');
  const [isSubmittingCommission, setIsSubmittingCommission] = useState(false);

  // Storefront banner state
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);

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
      const errText = await res.text();
      throw new Error(errText || `API error ${res.status}`);
    }
    return res.json();
  };

  // 1. Fetch Core Identity, Financials, and Volume via GET /api/v1/admin/teachers/{teacher_id}
  const {
    data: coreResponse,
    error: coreError,
    isLoading: isCoreLoading,
    mutate: mutateCore
  } = useSWR<{ status: string; data: TeacherCoreData }>(
    id ? `${apiUrl}/api/v1/admin/teachers/${id}` : null,
    authFetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // 2. Fetch Deep-Dive Papers via GET /api/v1/admin/teachers/{teacher_id}/papers
  const {
    data: papersResponse,
    isLoading: isPapersLoading,
    mutate: mutatePapers
  } = useSWR<{ status: string; data: PaperTabItem[]; meta: PaginationMeta }>(
    id ? `${apiUrl}/api/v1/admin/teachers/${id}/papers?page=${papersPage}&limit=10` : null,
    authFetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // 3. Fetch Deep-Dive Students via GET /api/v1/admin/teachers/{teacher_id}/students
  const {
    data: studentsResponse,
    isLoading: isStudentsLoading,
    mutate: mutateStudents
  } = useSWR<{ status: string; data: StudentTabItem[]; meta: PaginationMeta }>(
    id ? `${apiUrl}/api/v1/admin/teachers/${id}/students?page=${studentsPage}&limit=10` : null,
    authFetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // 4. Fetch Deep-Dive Payouts via GET /api/v1/admin/teachers/{teacher_id}/payouts
  const {
    data: payoutsResponse,
    isLoading: isPayoutsLoading,
    mutate: mutatePayouts
  } = useSWR<{ status: string; data: PayoutTabItem[]; meta: PaginationMeta }>(
    id ? `${apiUrl}/api/v1/admin/teachers/${id}/payouts?page=${payoutsPage}&limit=10` : null,
    authFetcher,
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // Loading skeleton when initial core data is fetching
  if (isCoreLoading && !coreResponse) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Navigation Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="space-y-2">
              <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-48 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
          </div>
        </div>

        {/* Identity Card Skeleton */}
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
              <div className="space-y-2.5">
                <div className="w-56 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-40 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="flex gap-3 pt-1">
                  <div className="w-36 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md h-20 bg-slate-100 dark:bg-[#1a1e29] rounded-xl border border-slate-200 dark:border-slate-700"></div>
          </div>
        </div>

        {/* 4 Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="bg-white dark:bg-[#252b3b] rounded-xl border border-slate-200 dark:border-slate-700/70 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
              </div>
              <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="h-64 bg-white dark:bg-[#252b3b] rounded-2xl border border-slate-200 dark:border-slate-700/70 flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading educator records from database...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error view if core data request failed
  if (coreError && !coreResponse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teachers')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#252b3b] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-slate-400 font-medium">
              <Link to="/teachers" className="hover:text-blue-600 dark:hover:text-blue-400">Teachers</Link>
              <span> / Error</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Teacher Record Not Found
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#252b3b] border border-rose-200 dark:border-rose-900/60 rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Could not load educator details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {coreError?.message || `No educator found with ID "${id}". The record may have been removed or you may lack administrator privileges.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/teachers')}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Back to Teachers
            </button>
            <button
              onClick={() => mutateCore()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strict Normalization for Core Data directly from Database
  const rawCore = (coreResponse?.data || {}) as any;
  const rawIdentity = rawCore.identity || rawCore || {};
  const rawFinancials = rawCore.financials || {};
  const rawVolume = rawCore.volume || {};
  const rawAttribution = rawFinancials.attribution || {};

  const teacherId = String(rawIdentity.teacher_id || id || '');
  const instituteName = String(rawIdentity.institute_name || rawIdentity.name || 'Educator');
  const teacherName = String(rawIdentity.name || rawIdentity.institute_name || 'Educator');
  const email = String(rawIdentity.email || '');
  const phone = rawIdentity.phone || null;
  const upiId = rawIdentity.upi_id || null;
  const bio = rawIdentity.bio || null;
  const bannerPath = rawIdentity.banner_path || null;
  const referralCode = rawIdentity.referral_code || null;
  const status = String(rawIdentity.status || 'ACTIVE').toUpperCase();
  const joinedAt = rawIdentity.joined_at || null;
  const revenueSharePct = Number(rawIdentity.revenue_share_pct ?? 70);

  // Financial Figures directly from Database
  const totalNetEarnings = Number(rawFinancials.total_net_earnings ?? 0);
  const pendingPayout = Number(rawFinancials.pending_payout ?? 0);
  const lastPayoutDate = rawFinancials.last_payout_date || null;

  // Attribution Breakdown directly from Database
  const directReferralAttribution: AttributionTier = rawAttribution.direct_referral || {
    revenue: 0,
    student_count: 0
  };
  const marketplaceAttribution: AttributionTier = rawAttribution.marketplace || {
    revenue: 0,
    student_count: 0
  };
  const affiliateAttribution: AttributionTier = rawAttribution.network_affiliate || {
    revenue: 0,
    student_count: 0
  };

  // Content Volume Stats directly from Database
  const activePapersCount = Number(rawVolume.active_papers ?? 0);
  const draftPapersCount = Number(rawVolume.draft_papers ?? 0);
  const totalTestAttempts = Number(rawVolume.total_test_attempts ?? 0);
  const rosterCount = Number(rawVolume.roster_count ?? 0);

  // Deep-dive items
  const papersList: PaperTabItem[] = papersResponse?.data || [];
  const papersMeta: PaginationMeta = papersResponse?.meta || {
    current_page: papersPage,
    limit: 10,
    total_records: papersList.length,
    total_pages: Math.ceil(papersList.length / 10) || 1,
    has_next: false,
    has_previous: papersPage > 1
  };

  const studentsList: StudentTabItem[] = studentsResponse?.data || [];
  const studentsMeta: PaginationMeta = studentsResponse?.meta || {
    current_page: studentsPage,
    limit: 10,
    total_records: studentsList.length,
    total_pages: Math.ceil(studentsList.length / 10) || 1,
    has_next: false,
    has_previous: studentsPage > 1
  };

  const payoutsList: PayoutTabItem[] = payoutsResponse?.data || [];
  const payoutsMeta: PaginationMeta = payoutsResponse?.meta || {
    current_page: payoutsPage,
    limit: 10,
    total_records: payoutsList.length,
    total_pages: Math.ceil(payoutsList.length / 10) || 1,
    has_next: false,
    has_previous: payoutsPage > 1
  };

  // Resolved Banner URL calculation
  const resolvedBannerUrl = useMemo(() => {
    if (!bannerPath) return null;
    if (bannerPath.startsWith('http://') || bannerPath.startsWith('https://')) {
      return bannerPath;
    }
    if (bannerPath.startsWith('/')) {
      return `${apiUrl}${bannerPath}`;
    }
    return `${apiUrl}/api/banner/${teacherId}/${bannerPath}`;
  }, [bannerPath, apiUrl, teacherId]);

  const handleCopy = (text: string, field: string) => {
    if (!text) {
      addToast(`No ${field} available to copy`, 'warning');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    addToast(`Copied ${field} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Quick Action Handler: Executes PATCH /api/v1/admin/teachers/{teacher_id}/actions
  const handleQuickAction = async (action: 'SUSPEND' | 'ACTIVATE' | 'OVERRIDE_COMMISSION', payload?: any) => {
    if (!teacherId) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`${apiUrl}/api/v1/admin/teachers/${teacherId}/actions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          action,
          reason: payload?.reason || (action === 'SUSPEND' ? 'Administrative suspension' : action === 'ACTIVATE' ? 'Administrative activation' : 'Commission override'),
          commission_tier_override: payload?.commission_tier_override ?? null
        })
      });

      if (!res.ok) {
        // Fallback to legacy status endpoint if actions endpoint returns 404
        if (res.status === 404 && (action === 'SUSPEND' || action === 'ACTIVATE')) {
          await fetch(`${apiUrl}/api/v1/admin/teachers/${teacherId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify({
              status: action === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED',
              rejection_reason: payload?.reason || ''
            })
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Action failed with status ${res.status}`);
        }
      }

      await Promise.all([
        mutateCore(),
        mutatePapers(),
        mutateStudents(),
        mutatePayouts()
      ]);

      addToast(
        action === 'OVERRIDE_COMMISSION'
          ? `Commission revenue share updated to ${payload.commission_tier_override}%`
          : `Teacher account status updated to ${action === 'ACTIVATE' ? 'ACTIVE' : 'SUSPENDED'}`,
        'success'
      );
    } catch (err: any) {
      console.error('Quick action error:', err);
      addToast(err.message || 'Failed to execute teacher action', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCommissionOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commissionOverrideInput < 0 || commissionOverrideInput > 100) {
      addToast('Commission percentage must be between 0 and 100', 'warning');
      return;
    }
    setIsSubmittingCommission(true);
    await handleQuickAction('OVERRIDE_COMMISSION', {
      commission_tier_override: commissionOverrideInput,
      reason: commissionReason || 'Admin revenue share adjustment'
    });
    setIsSubmittingCommission(false);
    setIsCommissionModalOpen(false);
  };

  const getStatusBadge = (st: string) => {
    const s = (st || '').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active Educator
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Pending Approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Suspended Account
      </span>
    );
  };

  const initials = instituteName
    ? instituteName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : teacherName
      ? teacherName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
      : 'ED';

  const referralUrl = referralCode
    ? `https://examsimula.com/question-papers?ref=${referralCode}`
    : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teachers')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#252b3b] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
            title="Back to Teachers Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Link to="/teachers" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Teachers
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">{instituteName}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Teacher Detail View
            </h1>
          </div>
        </div>

        {/* Quick Action Buttons: SUSPEND, ACTIVATE, OVERRIDE_COMMISSION */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Commission Override Trigger */}
          <button
            onClick={() => {
              setCommissionOverrideInput(revenueSharePct);
              setIsCommissionModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Commission ({revenueSharePct}%)</span>
          </button>

          {/* Suspend or Activate Account */}
          {status !== 'ACTIVE' ? (
            <button
              onClick={() => handleQuickAction('ACTIVATE')}
              disabled={isUpdatingStatus}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUpdatingStatus ? 'Updating...' : 'Approve & Activate'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleQuickAction('SUSPEND')}
              disabled={isUpdatingStatus}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isUpdatingStatus ? 'Updating...' : 'Suspend Account'}</span>
            </button>
          )}

          <button
            onClick={() => {
              mutateCore();
              mutatePapers();
              mutateStudents();
              mutatePayouts();
              addToast('Refreshed teacher records from database', 'info');
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#252b3b] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
            title="Refresh Details"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Educator Identity Card */}
      <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Avatar & Identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {instituteName}
                </h2>
                {getStatusBadge(status)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {teacherName}
              </p>

              {/* Contact & Meta Badges */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
                {email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email}</span>
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                  </span>
                )}
                {joinedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {new Date(joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Referral Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200/80 dark:border-slate-700/60 max-w-md w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Referral Link & Code
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {referralCode || 'NO-CODE'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralUrl}
                className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 outline-none truncate"
              />
              <button
                onClick={() => handleCopy(referralUrl, 'Referral Link')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedField === 'Referral Link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'Referral Link' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top-Half Metric Cards (Financials & Content Volume) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Earnings */}
        <div className="bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Total Lifetime Net Earnings</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                ₹{totalNetEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {revenueSharePct}% agreed educator revenue cut
            </p>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Pending Payout Balance</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                ₹{pendingPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {lastPayoutDate ? `Last paid: ${new Date(lastPayoutDate).toLocaleDateString('en-IN')}` : 'Ready for settlement cycle'}
            </p>
          </div>
        </div>

        {/* Network Roster Size */}
        <div className="bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Student Network Roster</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {rosterCount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 shrink-0">
              <Network className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              Students connected through referral code
            </p>
          </div>
        </div>

        {/* Live Published Papers */}
        <div className="bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Live Authored Papers</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {activePapersCount}
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {totalTestAttempts} student test attempts recorded
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700/60 flex items-center gap-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Attribution & Overview', icon: TrendingUp },
          { key: 'papers', label: `Papers Tab (${papersMeta.total_records || activePapersCount})`, icon: FileText },
          { key: 'students', label: `Students Tab (${studentsMeta.total_records || rosterCount})`, icon: Users },
          { key: 'payouts', label: `Payouts Tab (${payoutsMeta.total_records || 0})`, icon: Wallet },
          { key: 'branding', label: 'Storefront & Banner', icon: ImageIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ATTRIBUTION BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Revenue Attribution Breakdown by Channel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Platform accounting breakdown comparing educator referral audience purchases versus marketplace organic discovery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Direct Referral (70% cut) */}
              <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full">
                    Direct Referral (70%)
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Primary Channel</span>
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  ₹{Number(directReferralAttribution.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Generated from <span className="font-bold text-slate-900 dark:text-slate-200">{directReferralAttribution.student_count || 0}</span> referred students
                </p>
              </div>

              {/* Marketplace Organic (50% cut) */}
              <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 rounded-full">
                    Marketplace Organic (50%)
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ExamSimula Discovery</span>
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  ₹{Number(marketplaceAttribution.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Generated from <span className="font-bold text-slate-900 dark:text-slate-200">{marketplaceAttribution.student_count || 0}</span> organic marketplace purchasers
                </p>
              </div>

              {/* Network Affiliate (20% cut) */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#1a1e29]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    Network Affiliate (20%)
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cross-promotions</span>
                </div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  ₹{Number(affiliateAttribution.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Generated from <span className="font-bold text-slate-900 dark:text-slate-200">{affiliateAttribution.student_count || 0}</span> affiliate partner enrollments
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEEP-DIVE PAPERS TAB (GET /api/v1/admin/teachers/{teacher_id}/papers) */}
      {activeTab === 'papers' && (
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Authored Exam Question Papers ({papersMeta.total_records})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live database records with attempt statistics and gross revenue generated.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Page {papersMeta.current_page} of {papersMeta.total_pages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 dark:bg-[#1e2330]/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Paper Name</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Attempt Count</th>
                  <th className="py-3 px-6 text-right">Revenue Generated</th>
                  <th className="py-3 px-6">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {isPapersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading authored papers from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : papersList.length > 0 ? (
                  papersList.map((paper) => (
                    <tr key={paper.paper_id} className="hover:bg-slate-50/70 dark:hover:bg-[#1e2330]/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-slate-100">
                        {paper.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          paper.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${paper.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {paper.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-medium text-slate-700 dark:text-slate-300">
                        {paper.attempt_count.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{Number(paper.revenue_generated || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {paper.created_at ? new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                      No question papers authored yet by this educator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {papersMeta.total_pages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {papersList.length} of {papersMeta.total_records} papers
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPapersPage(p => Math.max(1, p - 1))}
                  disabled={!papersMeta.has_previous}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Previous
                </button>
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                  {papersMeta.current_page}
                </span>
                <button
                  onClick={() => setPapersPage(p => p + 1)}
                  disabled={!papersMeta.has_next}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEEP-DIVE STUDENTS TAB (GET /api/v1/admin/teachers/{teacher_id}/students) */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Enrolled Students Roster ({studentsMeta.total_records})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Students attempting this teacher's mock examinations with performance metrics and acquisition channel.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Page {studentsMeta.current_page} of {studentsMeta.total_pages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 dark:bg-[#1e2330]/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6 text-right">Tests Taken</th>
                  <th className="py-3 px-6 text-right">Avg Accuracy</th>
                  <th className="py-3 px-6">Acquisition Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {isStudentsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading student roster from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : studentsList.length > 0 ? (
                  studentsList.map((student) => (
                    <tr key={student.student_id} className="hover:bg-slate-50/70 dark:hover:bg-[#1e2330]/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-slate-100">
                        {student.name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 text-xs">
                        {student.email || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right font-medium text-slate-700 dark:text-slate-300">
                        {student.tests_taken}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-slate-100">
                        {Number(student.avg_accuracy || 0).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          student.joined_via.toLowerCase().includes('direct')
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {student.joined_via}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                      No student enrollment records found for this teacher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {studentsMeta.total_pages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {studentsList.length} of {studentsMeta.total_records} students
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStudentsPage(p => Math.max(1, p - 1))}
                  disabled={!studentsMeta.has_previous}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Previous
                </button>
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                  {studentsMeta.current_page}
                </span>
                <button
                  onClick={() => setStudentsPage(p => p + 1)}
                  disabled={!studentsMeta.has_next}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEEP-DIVE PAYOUTS TAB (GET /api/v1/admin/teachers/{teacher_id}/payouts) */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Payout Credentials Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Settlement Details */}
            <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Settlement & Bank Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    UPI ID (Instant Settlement)
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700/60">
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                      {upiId || 'Not configured'}
                    </span>
                    {upiId && (
                      <button
                        onClick={() => handleCopy(upiId, 'UPI ID')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {copiedField === 'UPI ID' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Revenue Share Agreement
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {revenueSharePct}% Direct / 50% Organic
                      </span>
                      <button
                        onClick={() => {
                          setCommissionOverrideInput(revenueSharePct);
                          setIsCommissionModalOpen(true);
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Change Rate
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Teacher receives {revenueSharePct}% of gross purchases through referral link and 50% for marketplace discovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Cycle Info */}
            <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Settlement Status
              </h3>

              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Pending Settlement Balance</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
                  ₹{pendingPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-blue-700/80 dark:text-blue-400 mt-1">
                  Automated payouts are processed via RazorpayX directly to the educator's registered UPI handle.
                </p>
              </div>
            </div>
          </div>

          {/* Historical Payouts Table from GET /api/v1/admin/teachers/{teacher_id}/payouts */}
          <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Disbursed Payout Records ({payoutsMeta.total_records})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ledger of processed financial transfers and transaction references.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Page {payoutsMeta.current_page} of {payoutsMeta.total_pages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 dark:bg-[#1e2330]/80 border-b border-slate-200 dark:border-slate-700/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Payout ID</th>
                    <th className="py-3 px-6 text-right">Amount (INR)</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Transaction Ref</th>
                    <th className="py-3 px-6">Settlement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {isPayoutsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading payout ledger from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payoutsList.length > 0 ? (
                    payoutsList.map((payout) => (
                      <tr key={payout.payout_id} className="hover:bg-slate-50/70 dark:hover:bg-[#1e2330]/50 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {payout.payout_id}
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹{Number(payout.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            payout.status === 'PAID'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">
                          {payout.transaction_ref || '—'}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400">
                          {payout.date ? new Date(payout.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                        No disbursed payout transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {payoutsMeta.total_pages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing {payoutsList.length} of {payoutsMeta.total_records} payouts
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPayoutsPage(p => Math.max(1, p - 1))}
                    disabled={!payoutsMeta.has_previous}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Previous
                  </button>
                  <span className="font-bold text-slate-800 dark:text-slate-200 px-2">
                    {payoutsMeta.current_page}
                  </span>
                  <button
                    onClick={() => setPayoutsPage(p => p + 1)}
                    disabled={!payoutsMeta.has_next}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STOREFRONT & BANNER */}
      {activeTab === 'branding' && (
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              Student Storefront & Promotional Banner
            </h3>
            <p className="text-xs text-slate-400">
              This banner appears on <span className="font-mono text-blue-600 dark:text-blue-400">examsimula.com/question-papers</span> when students enter using this educator's referral link.
            </p>
          </div>

          {/* Banner Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Aspect Ratio: Fixed 5:1 (1200 &times; 240px)</span>
              <span>Banner: {bannerPath ? 'Custom banner uploaded' : 'Default system banner'}</span>
            </div>

            <div className="w-full aspect-[5/1] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a1e29] overflow-hidden flex items-center justify-center relative shadow-inner">
              {resolvedBannerUrl && !bannerLoadFailed ? (
                <div className="w-full h-full relative">
                  <img
                    src={resolvedBannerUrl}
                    alt={`${instituteName} Banner`}
                    className="w-full h-full object-cover"
                    onError={() => setBannerLoadFailed(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <p className="text-white text-sm font-bold drop-shadow-sm">{instituteName}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
                  <div className="text-center p-4">
                    <p className="text-lg font-bold">{instituteName}</p>
                    <p className="text-xs text-slate-300 mt-1">{bio || "Curated Mock Examination Series"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio & Tagline */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Educator Bio & Tagline
            </label>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300">
              {bio || 'No biography provided.'}
            </div>
          </div>
        </div>
      )}

      {/* Commission Override Modal (PATCH /api/v1/admin/teachers/{teacher_id}/actions) */}
      {isCommissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Override Commission Tier
                </h3>
              </div>
              <button
                onClick={() => setIsCommissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCommissionOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Educator Revenue Share (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commissionOverrideInput}
                    onChange={(e) => setCommissionOverrideInput(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard tier is 70% for direct referral purchases and 50% for marketplace discovery.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Reason for Override (Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={commissionReason}
                  onChange={(e) => setCommissionReason(e.target.value)}
                  placeholder="e.g., Enterprise partner tier agreement, custom onboarding concession..."
                  className="w-full bg-slate-50 dark:bg-[#1a1e29] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCommission}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCommission ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDetail;

import ExamSimulaLogo from "../components/common/Logo";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  DollarSign,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Tv,
  ArrowRight,
  LogOut,
  RefreshCw,
  HelpCircle,
  Layers,
  ChevronDown,
  AtSign,
  Hash,
  User as UserIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Footer, getStudentAppUrl } from '../components/layout/Footer';

interface ChannelEntry {
  id: string;
  name: string;
  handle: string;
  channelId: string;
}

interface ApplicationData {
  id: string;
  user_id: string;
  channel_data: Record<string, { name: string; handle: string; id: string; subject?: string }>;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  created_at?: string;
}

const SUBJECT_OPTIONS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Computer Science',
  'General Studies / UPSC',
  'Commerce & Economics',
  'Engineering / GATE',
  'Other'
];

export function Registration() {
  const { user, isLoggedIn, isLoadingAuth, logout } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();

  // Multi-channel state with 3 distinct fields per channel
  const [channels, setChannels] = useState<ChannelEntry[]>([
    { id: '1', name: '', handle: '', channelId: '' }
  ]);
  const [primarySubject, setPrimarySubject] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<ApplicationData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const fetchApplicationStatus = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoadingStatus(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/application/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExistingApp(data);
      } else if (res.status === 404) {
        setExistingApp(null);
      }
    } catch (err) {
      console.error('Error fetching application status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplicationStatus();
    } else {
      setIsLoadingStatus(false);
    }
  }, [isLoggedIn]);

  const handleGoogleLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/google/login?role=TEACHER&redirect_url=${redirectUrl}`;
  };

  const addChannel = () => {
    setChannels(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', handle: '', channelId: '' }
    ]);
  };

  const removeChannel = (indexToRemove: number) => {
    if (channels.length <= 1) {
      addToast('At least one channel is required.', 'warning');
      return;
    }
    setChannels(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateChannel = (index: number, field: keyof ChannelEntry, value: string) => {
    setChannels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation across all channel cards
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      if (!ch.name.trim()) {
        addToast(`Please enter the Channel Name for Channel ${i + 1}.`, 'error');
        return;
      }
      if (!ch.handle.trim()) {
        addToast(`Please enter the Channel Handle for Channel ${i + 1}.`, 'error');
        return;
      }
      if (!ch.channelId.trim()) {
        addToast(`Please enter the Channel ID for Channel ${i + 1}.`, 'error');
        return;
      }
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      addToast('Session expired. Please log in with Google first.', 'error');
      return;
    }

    const channel_data: Record<string, any> = {};
    channels.forEach((ch, idx) => {
      const formattedHandle = ch.handle.trim().startsWith('@')
        ? ch.handle.trim()
        : `@${ch.handle.trim()}`;
      channel_data[`channel_${idx + 1}`] = {
        name: ch.name.trim(),
        handle: formattedHandle,
        id: ch.channelId.trim(),
        subject: primarySubject || 'General'
      };
    });

    const payload = { channel_data };

    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_AUTH_URL}/api/v1/application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit application.');
      }

      addToast('Application submitted successfully! Your review is pending.', 'success');
      setExistingApp(data);
    } catch (err: any) {
      addToast(err.message || 'Submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#003fb1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#faf8ff]">
      <div className="w-full flex-grow flex flex-col lg:flex-row">
      {/* ============================================================ */}
      {/* LEFT PANEL: Brand, Value Proposition & Creator Network Perks */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 bg-[#003fb1] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-indigo-900/40 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand Lockup */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <ExamSimulaLogo size={38} />
            <div>
              <span className="font-sans font-extrabold text-2xl tracking-tight text-white">ExamSimula</span>
              <span className="block text-[10px] font-bold text-blue-200 tracking-widest uppercase">
                Teacher Portal
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            Empowering YouTube Educators
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Monetize your audience with <span className="text-blue-200 underline decoration-blue-300/40 underline-offset-4">70% revenue splits</span>.
          </h1>

          <p className="text-blue-100 text-base leading-relaxed max-w-lg mb-10">
            Turn offline resources into automated online revenue. Distribute official test papers, conduct proctored mock exams, and deliver deep student analytics.
          </p>

          {/* Value Proposition Cards */}
          <div className="space-y-4 max-w-lg">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-start gap-4">
              <div className="p-2.5 bg-white/15 rounded-xl text-blue-200 shrink-0 mt-0.5">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Industry-Leading 70% Revenue Share</h3>
                <p className="text-xs text-blue-100/90 mt-0.5 leading-normal">
                  Receive automated UPI & Razorpay payouts for every test paper and subscription enrolled under your educator code.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-start gap-4">
              <div className="p-2.5 bg-white/15 rounded-xl text-blue-200 shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Zero-Setup Test Creation</h3>
                <p className="text-xs text-blue-100/90 mt-0.5 leading-normal">
                  Turn your offline resources into online revenue. Simply upload your PDF question papers and answer keys. ExamSimula automatically maps them into a professional, timed exam interface ready for your students to purchase.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-start gap-4">
              <div className="p-2.5 bg-white/15 rounded-xl text-blue-200 shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Real-Time Student Performance Analytics</h3>
                <p className="text-xs text-blue-100/90 mt-0.5 leading-normal">
                  Access deep student percentile rankings, chapter heatmaps, and question difficulty telemetry seamlessly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="relative z-10 pt-10 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            <span>Verified Educator Application Process</span>
          </div>
          <span>ExamSimula Network</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANEL: Centered Form & Two-Step Workflow Intercept    */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 flex flex-col relative"
        >
          {/* Logo Lockup for Form Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex justify-center mb-3">
              <ExamSimulaLogo size={48} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              ExamSimula
            </h2>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#003fb1] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mt-1">
              TEACHER PORTAL
            </p>
          </div>

          {/* ============================================================ */}
          {/* STATE 4: Already Verified Teacher                            */}
          {/* ============================================================ */}
          {isLoggedIn && user?.role === 'TEACHER' ? (
            <div className="text-center py-4 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                VERIFIED TEACHER ACCOUNT
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Welcome Back, {user.name}!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your educator credentials are active. You have full access to your teacher dashboard.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-[#003fb1] text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                Go to Teacher Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : /* ============================================================ */
            /* STATE 3: Static "Waiting Room" Screen (Application Pending)  */
            /* ============================================================ */
            isLoggedIn && existingApp && existingApp.status === 'pending' ? (
              <div className="space-y-6">
                {/* Feedback Badge matching SANDBOX-REVIEW badge style */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider border border-amber-300/80 shadow-sm">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-amber-700" />
                    APPLICATION PENDING REVIEW
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Application Under Review</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Thank you for applying to the ExamSimula Educator Network, <strong className="text-slate-800">{user?.name}</strong>!
                    Your channel details have been received and are currently under verification by our team.
                  </p>
                </div>

                {/* Segregated Application Details Summary */}
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Applicant Email</span>
                    <span className="font-bold text-slate-800">{user?.email}</span>
                  </div>

                  {Object.entries(existingApp.channel_data || {}).map(([key, chData], idx) => (
                    <div key={key} className="bg-white rounded-xl p-4 border border-blue-200/80 shadow-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="px-2 py-0.5 bg-blue-50 text-[#003fb1] font-bold text-[10px] rounded-md border border-blue-100 uppercase tracking-wider">
                          Channel {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#003fb1]">{chData.handle}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Name</span>
                          <span className="font-semibold text-slate-800">{chData.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Channel ID</span>
                          <span className="font-mono text-slate-700 truncate block">{chData.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Review Timeline</span>
                    <span className="font-bold text-amber-800">24 – 48 Hours</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={fetchApplicationStatus}
                    className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    Refresh Verification Status
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out ({user?.email})
                  </button>
                </div>
              </div>
            ) : /* ============================================================ */
              /* STATE 2: The Application Intercept (Post-Google Auth)        */
              /* ============================================================ */
              isLoggedIn && user ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Welcome, {user.name || 'Educator'}!
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Complete your profile by adding your educational YouTube channels.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      <span>Logged in as <strong>{user.email}</strong></span>
                      <button
                        onClick={logout}
                        className="text-rose-600 hover:underline font-semibold ml-1"
                      >
                        (Switch)
                      </button>
                    </div>
                  </div>

                  {/* Show Rejection note if previously rejected */}
                  {existingApp && existingApp.status === 'rejected' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Application Revision Needed</strong>
                        <span>{existingApp.admin_notes || 'Please verify your channel details and re-submit for approval.'}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Segregated Multi-Channel Cards List */}
                    <div className="space-y-4">
                      {channels.map((ch, index) => (
                        <motion.div
                          key={ch.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4.5 bg-slate-50/80 rounded-2xl border-2 border-slate-200 hover:border-blue-200 transition-colors space-y-3.5 relative"
                        >
                          {/* Channel Card Header / Segregation */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#003fb1] text-white font-bold text-xs flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">
                                Channel {index + 1}
                              </span>
                            </div>

                            {channels.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChannel(index)}
                                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Field 1: Channel Name */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                              Channel Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={ch.name}
                                onChange={(e) => updateChannel(index, 'name', e.target.value)}
                                placeholder="ExamSimula"
                                className="w-full px-3.5 py-2.5 pl-10 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#003fb1] focus:border-transparent transition-all shadow-sm"
                              />
                              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            </div>
                          </div>

                          {/* Field 2: Channel Handle */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                              Channel Handle <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={ch.handle}
                                onChange={(e) => updateChannel(index, 'handle', e.target.value)}
                                placeholder="@ExamSimula"
                                className="w-full px-3.5 py-2.5 pl-10 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#003fb1] focus:border-transparent transition-all shadow-sm"
                              />
                              <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            </div>
                          </div>

                          {/* Field 3: Channel ID */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                              Channel ID <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={ch.channelId}
                                onChange={(e) => updateChannel(index, 'channelId', e.target.value)}
                                placeholder="UCR%RvujFjasf6578QRkfI-jfw"
                                className="w-full px-3.5 py-2.5 pl-10 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#003fb1] focus:border-transparent transition-all shadow-sm"
                              />
                              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Option to Add Another Channel */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={addChannel}
                        className="w-full py-2.5 px-4 bg-white border border-dashed border-[#003fb1]/60 text-[#003fb1] hover:bg-blue-50/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        + Add Another Channel
                      </button>
                    </div>

                    {/* Optional: Primary Subject Dropdown */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Primary Domain / Subject <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={primarySubject}
                          onChange={(e) => setPrimarySubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003fb1] focus:border-transparent transition-all shadow-sm appearance-none pr-10"
                        >
                          <option value="">Select your primary domain / subject</option>
                          {SUBJECT_OPTIONS.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* Submit Application Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-[#003fb1] hover:bg-blue-800 text-white rounded-xl font-semibold shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ============================================================ */
                /* STATE 1: Initial Authentication (Unauthenticated)           */
                /* ============================================================ */
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Create your Teacher Account
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Join the ExamSimula creator network.
                    </p>
                  </div>

                  {/* Single prominent Continue with Google Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all shadow-sm text-sm"
                    >
                      {/* Official Google G Logo SVG */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </div>

                  {/* Subtitle & Terms Footer */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Already have an account?{' '}
                      <Link to="/login" className="text-[#003fb1] font-semibold hover:underline">
                        Log in
                      </Link>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-6 leading-normal">
                      By continuing, you agree to ExamSimula’s <a href={getStudentAppUrl('/terms')} target="_blank" rel="noopener noreferrer" className="text-[#003fb1] hover:underline font-medium">Terms of Use</a> and <a href={getStudentAppUrl('/privacy')} target="_blank" rel="noopener noreferrer" className="text-[#003fb1] hover:underline font-medium">Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              )}
        </motion.div>
      </div>
      </div>
      <Footer compact />
    </div>
  );
}

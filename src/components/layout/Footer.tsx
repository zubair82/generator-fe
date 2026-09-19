import ExamSimulaLogo from "../common/Logo";
import React from 'react';
import { ShieldCheck, Mail, MapPin, ExternalLink } from 'lucide-react';

interface FooterProps {
  compact?: boolean;
}

export function getStudentAppUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.VITE_STUDENT_APP_URL) {
    const base = (import.meta.env.VITE_STUDENT_APP_URL as string).replace(/\/$/, '');
    return `${base}${cleanPath}`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Local development (localhost, teacher.localhost, admin.localhost, 127.0.0.1)
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local')
    ) {
      return `${protocol}//localhost:9000${cleanPath}`;
    }

    // Production (teacher.examsimula.com, admin.examsimula.com -> examsimula.com)
    const rootDomain = hostname.replace(/^(teacher|admin)\./, '');
    return `${protocol}//${rootDomain}${cleanPath}`;
  }

  return `https://examsimula.com${cleanPath}`;
}

export function Footer({ compact = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="w-full bg-white dark:bg-[#1f2430] border-t border-slate-200 dark:border-slate-800 py-6 px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ExamSimulaLogo size={20} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">ExamSimula</span>
            <span>&copy; {currentYear} All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <a href={getStudentAppUrl('/terms')} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms of Use
            </a>
            <a href={getStudentAppUrl('/privacy')} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href={getStudentAppUrl('/refund-policy')} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Cancellation & Refund Policy
            </a>
            <a href={getStudentAppUrl('/contact')} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-slate-900 dark:bg-[#151821] text-slate-400 border-t border-slate-800 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white text-xl font-bold tracking-tight">
              <ExamSimulaLogo size={32} />
              <span>ExamSimula</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              India's premier AI-powered exam simulation platform and multi-creator academic marketplace for JEE, NEET, and competitive exams.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Razorpay Secured & SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <a href={getStudentAppUrl('/home')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/question-papers')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Mock Test Papers
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/dashboard')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Student Dashboard
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/login')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Student Portal Login
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance (Razorpay Mandate) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Policies & Legal</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <a href={getStudentAppUrl('/terms')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Terms of Use</span>
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/privacy')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/refund-policy')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Cancellation & Refund</span>
                </a>
              </li>
              <li>
                <a href={getStudentAppUrl('/legal')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors text-xs text-blue-400 flex items-center gap-1 mt-1">
                  <span>All Policies & Disclaimers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Support & Office</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-tight">
                  Bengaluru, Karnataka, India - 560102
                </span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@examsimula.com" className="text-xs hover:text-white transition-colors">
                  support@examsimula.com
                </a>
              </li>
              <li className="pt-2">
                <a 
                  href={getStudentAppUrl('/contact')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Contact Support Team
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {currentYear} ExamSimula. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href={getStudentAppUrl('/terms')} target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href={getStudentAppUrl('/privacy')} target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href={getStudentAppUrl('/refund-policy')} target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Refund Policy</a>
            <a href={getStudentAppUrl('/contact')} target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

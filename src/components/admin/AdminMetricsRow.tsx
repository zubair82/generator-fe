import React from 'react';
import { Users, FileText, IndianRupee, Network } from 'lucide-react';

export interface AdminMetricsData {
  total_active_teachers?: number;
  total_supply_volume?: number;
  total_pending_payouts_inr?: number;
  total_network_roster?: number;
}

export interface AdminMetricsRowProps {
  data?: AdminMetricsData | null;
  isLoading?: boolean;
}

export const AdminMetricsRow: React.FC<AdminMetricsRowProps> = ({
  data,
  isLoading = false
}) => {
  const metrics = [
    {
      title: "Total Active Teachers",
      value: data?.total_active_teachers !== undefined
        ? data.total_active_teachers.toLocaleString('en-IN')
        : "142",
      subtext: "+12 pending approval",
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderGlow: "group-hover:border-blue-500/30"
    },
    {
      title: "Total Supply Volume",
      value: data?.total_supply_volume !== undefined
        ? data.total_supply_volume.toLocaleString('en-IN')
        : "384",
      subtext: "Live exam papers",
      icon: <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
      borderGlow: "group-hover:border-indigo-500/30"
    },
    {
      title: "Total Pending Payouts",
      value: data?.total_pending_payouts_inr !== undefined
        ? `₹${Number(data.total_pending_payouts_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : "₹45,200",
      subtext: "For current billing cycle",
      icon: <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderGlow: "group-hover:border-emerald-500/30"
    },
    {
      title: "Total Network Roster",
      value: data?.total_network_roster !== undefined
        ? data.total_network_roster.toLocaleString('en-IN')
        : "4,250",
      subtext: "Students via referral links",
      icon: <Network className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderGlow: "group-hover:border-orange-500/30"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-7 w-20 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="mt-4">
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="group bg-white dark:bg-[#252b3b] rounded-xl border border-gray-100 dark:border-slate-700/70 p-5 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                {metric.title}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                {metric.value}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${metric.bgColor} shrink-0 transition-transform group-hover:scale-105`}>
              {metric.icon}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {metric.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminMetricsRow;


import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'purple' | 'red' | 'emerald' | 'amber' | 'blue';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan',
  trend
}) => {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      glow: 'group-hover:border-cyan-500/40'
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      glow: 'group-hover:border-purple-500/40'
    },
    red: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      iconBg: 'bg-red-500/15 text-red-400 border-red-500/30',
      glow: 'group-hover:border-red-500/40'
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      glow: 'group-hover:border-emerald-500/40'
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      glow: 'group-hover:border-amber-500/40'
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      glow: 'group-hover:border-blue-500/40'
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div
      id={id}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 glass-card glass-card-hover ${scheme.glow}`}
    >
      {/* Top indicator bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};

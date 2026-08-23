import React from 'react';
import { SeverityLevel } from '../../types';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showIcon = true,
  size = 'md'
}) => {
  const config = {
    critical: {
      label: 'Critical',
      bg: 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
      dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
      icon: AlertOctagon
    },
    high: {
      label: 'High',
      bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
      dot: 'bg-orange-500 shadow-[0_0_6px_#f97316]',
      icon: AlertTriangle
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-400',
      icon: AlertCircle
    },
    low: {
      label: 'Low',
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      icon: CheckCircle
    }
  };

  const item = config[severity] || config.low;
  const Icon = item.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  };

  return (
    <span
      id={`severity-badge-${severity}`}
      className={`inline-flex items-center rounded-full border whitespace-nowrap uppercase tracking-wider ${item.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {item.label}
    </span>
  );
};

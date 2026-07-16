import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from 'lucide-react';
import { TaskPriority } from '../../types';
import { cn } from '../../lib/utils';

export function PriorityBadge({ priority }: { priority: TaskPriority | string | number | null | undefined }) {
  const map: Record<
    TaskPriority,
    {
      cls: string;
      icon: React.ReactNode;
    }> =
  {
    Low: {
      cls: 'bg-bg text-secondary border border-line',
      icon: <ArrowDown size={11} />
    },
    Medium: {
      cls: 'bg-bg text-maintext border border-line',
      icon: <ArrowRight size={11} />
    },
    High: {
      cls: 'border border-accent text-accent',
      icon: <ArrowUp size={11} />
    },
    Urgent: {
      cls: 'bg-accent text-black',
      icon: <AlertTriangle size={11} />
    }
  };

  const normalizedPriority = (() => {
    if (typeof priority === 'number') {
      if (priority === 1) return 'Low' as TaskPriority;
      if (priority === 2) return 'Medium' as TaskPriority;
      if (priority === 3) return 'High' as TaskPriority;
      if (priority === 4) return 'Urgent' as TaskPriority;
      return 'Medium' as TaskPriority;
    }

    if (typeof priority === 'string') {
      const value = priority.trim().toLowerCase();
      if (value === 'low' || value === '1') return 'Low' as TaskPriority;
      if (value === 'medium' || value === '2') return 'Medium' as TaskPriority;
      if (value === 'high' || value === '3') return 'High' as TaskPriority;
      if (value === 'urgent' || value === '4') return 'Urgent' as TaskPriority;
      return 'Medium' as TaskPriority;
    }

    return 'Medium' as TaskPriority;
  })();

  const config = map[normalizedPriority] ?? map.Medium;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
        config.cls
      )}>
      {config.icon}
      {normalizedPriority}
    </span>
  );
}
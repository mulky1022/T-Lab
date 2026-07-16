import React, { useMemo, useState } from 'react';
import { Download, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useData } from '../context/DataContext';
import { AuditCategory } from '../types';
import { cn } from '../lib/utils';

const categories: (AuditCategory | 'All')[] = ['All', 'User', 'Project', 'Task', 'Auth', 'System'];
const PAGE_SIZE = 8;

function AuditPageContent() {
  const { auditLogs, users } = useData();
  const [filter, setFilter] = useState<AuditCategory | 'All'>('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (filter === 'All') return auditLogs;
    return auditLogs.filter((log) => log.category === filter);
  }, [auditLogs, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const rows = [
      ['Timestamp', 'Actor', 'Action', 'Target', 'Category'],
      ...filtered.map((log) => [
        log.timestamp,
        users.find((user) => user.id === log.actorId)?.name || log.actorId,
        log.action,
        log.target,
        log.category,
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tlab-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log report exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="System events across your organization"
        action={
          <Button onClick={exportCsv}>
            <Download size={16} /> Export report
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setFilter(category);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === category
                ? 'border-accent bg-accent text-black'
                : 'border-line bg-card text-secondary hover:border-accent'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ScrollText}
            title="No logs found"
            description="No events match this category."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-card text-xs uppercase tracking-wide text-secondary">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Target</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageItems.map((log) => {
                  const actor = users.find((user) => user.id === log.actorId);
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-bg">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={actor?.name || '?'} color={actor?.avatarColor} size="sm" />
                          <span className="whitespace-nowrap text-sm font-medium text-maintext">{actor?.name || log.actorId}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-maintext">{log.action}</td>
                      <td className="hidden px-5 py-3 text-sm text-secondary md:table-cell">{log.target}</td>
                      <td className="px-5 py-3">
                        <Badge variant={log.category === 'System' ? 'accent' : 'neutral'}>{log.category}</Badge>
                      </td>
                      <td className="hidden px-5 py-3 whitespace-nowrap text-sm text-secondary sm:table-cell">{log.timestamp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <AppLayout>
      <AuditPageContent />
    </AppLayout>
  );
}

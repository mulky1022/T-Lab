import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  CalendarClock,
  Activity } from
'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid } from
'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { taskCounts, projectProgressFrom } from '../lib/projectUtils';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Avatar } from '../components/ui/Avatar';
import {
  Skeleton,
  CardSkeleton,
  useSimulatedLoading } from
'../components/ui/Skeleton';
import { formatDate } from '../lib/utils';
import { AppLayout } from '../components/layout/AppLayout';
const tooltipStyle = {
  backgroundColor: 'var(--tl-card)',
  border: '1px solid var(--tl-border)',
  borderRadius: '0.75rem',
  color: 'var(--tl-text)',
  fontSize: 12
};
export function Dashboard() {
  const { currentUser } = useAuth();
  const { tasks, projects, users, auditLogs } = useData();
  const loading = useSimulatedLoading(700);
  const role = currentUser?.role;
  const isMember = role === 'Team Member';
  const isAdmin = role === 'Administrator';
  const myTasks = isMember ?
  tasks.filter((t) => t.assigneeId === currentUser?.id) :
  tasks;
  const counts = taskCounts(myTasks);
  const visibleProjects = isMember ?
  projects.filter((p) => p.memberIds.includes(currentUser!.id)) :
  projects;
  const pieData = useMemo(
    () => [
    {
      name: 'To Do',
      value: counts.todo,
      key: 'Todo'
    },
    {
      name: 'In Progress',
      value: counts.inProgress,
      key: 'In Progress'
    },
    {
      name: 'Review',
      value: counts.review,
      key: 'Review'
    },
    {
      name: 'Completed',
      value: counts.completed,
      key: 'Completed'
    }],

    [counts.todo, counts.inProgress, counts.review, counts.completed]
  );
  const barData = useMemo(
    () =>
    visibleProjects.map((p) => ({
      name: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name,
      tasks: tasks.filter((t) => t.projectId === p.id).length,
      done: tasks.filter(
        (t) => t.projectId === p.id && t.status === 'Completed'
      ).length
    })),
    [visibleProjects, tasks]
  );
  const trendData = [
  {
    month: 'Feb',
    completed: 4
  },
  {
    month: 'Mar',
    completed: 7
  },
  {
    month: 'Apr',
    completed: 11
  },
  {
    month: 'May',
    completed: 18
  },
  {
    month: 'Jun',
    completed: 24
  },
  {
    month: 'Jul',
    completed: 24 + counts.completed
  }];

  const upcoming = [...myTasks]
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => {
      const aTime = a.dueDate ? Date.parse(a.dueDate) : Infinity;
      const bTime = b.dueDate ? Date.parse(b.dueDate) : Infinity;
      return aTime - bTime;
    })
    .slice(0, 5);
  const workload = useMemo(() => {
    const members = users.filter(
      (u) => u.role === 'Team Member' && u.status === 'Active'
    );
    return members.
    map((m) => ({
      user: m,
      open: tasks.filter(
        (t) => t.assigneeId === m.id && t.status !== 'Completed'
      ).length
    })).
    sort((a, b) => b.open - a.open).
    slice(0, 5);
  }, [users, tasks]);
  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) =>
          <Skeleton key={i} className="h-24" />
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>);

  }
  return (
    <div>
      <PageHeader
        title={`Welcome, ${currentUser?.name.split(' ')[0]}`}
        subtitle={
        isAdmin ?
        'System overview across LankaTech Solutions' :
        role === 'Project Manager' ?
        'Your projects and team activity' :
        'Your assigned work at a glance'
        } />
      

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={isMember ? 'My Projects' : 'Projects'}
          value={visibleProjects.length}
          icon={FolderKanban}
          accent />
        
        <StatCard
          label={isMember ? 'My Tasks' : 'Total Tasks'}
          value={counts.total}
          icon={CheckSquare} />
        
        <StatCard label="In Progress" value={counts.inProgress} icon={Clock} />
        <StatCard
          label={isAdmin ? 'Users' : 'Completed'}
          value={isAdmin ? users.length : counts.completed}
          icon={isAdmin ? UsersIcon : CheckCircle2} />
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <Card className="p-5">
          <h2 className="font-display font-semibold text-maintext mb-3">
            Task status distribution
          </h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="var(--tl-card)">
                  
                  {pieData.map((entry) =>
                  <Cell
                    key={entry.key}
                    fill={
                    entry.key === 'In Progress' || entry.key === 'Completed' ?
                    '#FFAB00' :
                    entry.key === 'Review' ?
                    '#2C2C2C' :
                    '#F5F5F5'
                    } />

                  )}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {pieData.map((d) =>
            <span key={d.key} className="text-xs text-secondary">
                {d.name}:{' '}
                <span className="text-maintext font-medium">{d.value}</span>
              </span>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-maintext mb-3">
            Tasks per project
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 4,
                  right: 4,
                  left: -24,
                  bottom: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--tl-border)"
                  vertical={false} />
                
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--tl-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: 'var(--tl-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false} />
                
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{
                    fill: 'var(--tl-border)',
                    opacity: 0.3
                  }} />
                
                <Bar
                  dataKey="tasks"
                  name="Total"
                  fill="#2C2C2C"
                  radius={[6, 6, 0, 0]} />
                
                <Bar
                  dataKey="done"
                  name="Completed"
                  fill="#FFAB00"
                  radius={[6, 6, 0, 0]} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 md:col-span-2 xl:col-span-1">
          <h2 className="font-display font-semibold text-maintext mb-3">
            Completion trend
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{
                  top: 4,
                  right: 4,
                  left: -24,
                  bottom: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--tl-border)"
                  vertical={false} />
                
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--tl-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: 'var(--tl-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed tasks"
                  stroke="#FFAB00"
                  strokeWidth={2}
                  fill="#FFAB00"
                  fillOpacity={0.15} />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-maintext">
              {isMember ? 'My projects' : 'Active projects'}
            </h2>
            <Link
              href="/projects"
              className="text-sm text-accent hover:underline">
              
              View all
            </Link>
          </div>
          {visibleProjects.slice(0, 3).map((p) =>
          <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="p-5 hover:border-accent transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-maintext truncate">
                      {p.name}
                    </h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-1">
                      {p.description}
                    </p>
                  </div>
                  <span className="text-sm font-display font-bold text-accent shrink-0">
                    {projectProgressFrom(tasks, p.id)}%
                  </span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={projectProgressFrom(tasks, p.id)} />
                </div>
              </Card>
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-semibold text-maintext flex items-center gap-2">
            <CalendarClock size={16} className="text-accent" /> Upcoming
            deadlines
          </h2>
          <Card className="divide-y divide-line">
            {upcoming.map((t) =>
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="p-4 flex items-center gap-3 hover:bg-bg transition-colors">
              
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-maintext truncate">{t.title}</p>
                  <p className="text-xs text-secondary mt-0.5">
                    Due {formatDate(t.dueDate)}
                  </p>
                </div>
                <PriorityBadge priority={t.priority} />
              </Link>
            )}
            {upcoming.length === 0 &&
            <p className="p-6 text-sm text-secondary text-center">
                No upcoming deadlines.
              </p>
            }
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-semibold text-maintext flex items-center gap-2">
            <Activity size={16} className="text-accent" />{' '}
            {isAdmin ? 'Recent activity' : 'Team workload'}
          </h2>
          {isAdmin ?
          <Card className="divide-y divide-line">
              {auditLogs.slice(0, 6).map((log) => {
              const actor = users.find((u) => u.id === log.actorId);
              return (
                <div key={log.id} className="p-4 flex items-center gap-3">
                    <Avatar
                    name={actor?.name || '?'}
                    color={actor?.avatarColor}
                    size="sm" />
                  
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-maintext truncate">
                        <span className="font-medium">{actor?.name || 'System'}</span>{' '}
                        {(log.action ? log.action.toLowerCase() : 'updated')}
                      </p>
                      <p className="text-xs text-secondary truncate">
                        {log.target || 'Activity'} · {log.timestamp}
                      </p>
                    </div>
                  </div>);

            })}
            </Card> :

          <Card className="p-5 space-y-4">
              {workload.map(({ user, open }) =>
            <div key={user.id} className="flex items-center gap-3">
                  <Avatar name={user.name} color={user.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-maintext truncate">
                      {user.name}
                    </p>
                    <ProgressBar value={Math.min(100, open * 25)} />
                  </div>
                  <span className="text-xs text-secondary shrink-0">
                    {open} open
                  </span>
                </div>
            )}
            </Card>
          }
        </div>
      </div>
    </div>);

}

export default function DashboardPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckSquare,
  Flag,
  Banknote,
  Zap } from
'lucide-react';
import { useData } from '../context/DataContext';
import { getProject } from '../lib/api';
import { projectProgressFrom, taskCounts } from '../lib/projectUtils';
import { formatDate } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AppLayout } from '../components/layout/AppLayout';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { cn } from '../lib/utils';
import { ProjectStatus } from '../types';
const statusVariant: Record<ProjectStatus, 'accent' | 'outline' | 'neutral'> = {
  Planning: 'neutral',
  Active: 'accent',
  Completed: 'outline',
  Archived: 'neutral'
};
const tabList = ['Overview', 'Tasks', 'Milestones', 'Timeline', 'Team'];
export function ProjectDetails() {
  const router = useRouter();
  const id = Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;
  const { users, tasks } = useData();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProject(id)
      .then((data) => setProject(data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Card>
        <p className="p-6 text-center text-secondary">Loading project...</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon={CheckSquare}
          title="Project not found"
          action={
          <Button onClick={() => router.push('/projects')}>
              Back to projects
            </Button>
          } />
        
      </Card>);

  }
  const manager = users.find((u) => u.id === project.managerId);
  const members = users.filter((u) => project.memberIds.includes(u.id));
  const pTasks = tasks.filter((t) => t.projectId === project.id);
  const counts = taskCounts(pTasks);
  const progress = projectProgressFrom(tasks, project.id);
  const milestonesDone = project.milestones.filter((m) => m.completed).length;
  const timelineItems = [
  ...project.milestones.map((m) => ({
    id: m.id,
    type: 'Milestone' as const,
    name: m.name,
    date: m.dueDate,
    done: m.completed
  })),
  ...project.sprints.map((s) => ({
    id: s.id,
    type: 'Sprint' as const,
    name: `${s.name} — ${s.goal}`,
    date: s.startDate,
    done: false
  }))].
  sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      <button
        onClick={() => router.push('/projects')}
        className="flex items-center gap-1 text-sm text-secondary hover:text-accent mb-4">
        
        <ArrowLeft size={16} /> Back to projects
      </button>

      <PageHeader
        title={project.name}
        subtitle={project.description}
        action={
        <div className="flex items-center gap-2">
            <Badge variant={statusVariant[project.status]}>
              {project.status}
            </Badge>
            <Badge variant="accent">{progress}% complete</Badge>
          </div>
        } />
      

      <div className="mb-6">
        <Tabs tabs={tabList} active={tab} onChange={setTab} />
      </div>

      {tab === 'Overview' &&
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="font-display font-semibold text-maintext mb-4">
                Progress overview
              </h2>
              <ProgressBar value={progress} showLabel />
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-maintext">
                    {counts.todo}
                  </p>
                  <p className="text-xs text-secondary mt-1">To Do</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-accent">
                    {counts.inProgress}
                  </p>
                  <p className="text-xs text-secondary mt-1">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-maintext">
                    {counts.review}
                  </p>
                  <p className="text-xs text-secondary mt-1">Review</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-maintext">
                    {counts.completed}
                  </p>
                  <p className="text-xs text-secondary mt-1">Completed</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-display font-semibold text-maintext mb-4 flex items-center gap-2">
                <Zap size={16} className="text-accent" /> Active sprints
              </h2>
              {project.sprints.length === 0 &&
            <p className="text-sm text-secondary">
                  No active sprints for this project.
                </p>
            }
              <div className="space-y-3">
                {project.sprints.map((s) =>
              <div
                key={s.id}
                className="p-4 rounded-xl bg-bg border border-line">
                
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-medium text-maintext">
                        {s.name}
                      </p>
                      <span className="text-xs text-secondary">
                        {formatDate(s.startDate)} – {formatDate(s.endDate)}
                      </span>
                    </div>
                    <p className="text-sm text-secondary mt-1">
                      Goal: {s.goal}
                    </p>
                  </div>
              )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display font-semibold text-maintext mb-4">
                Project info
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-secondary">
                  <Users size={15} className="text-accent" /> Manager
                  <span className="text-maintext ml-auto">{manager?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Banknote size={15} className="text-accent" /> Budget
                  <span className="text-maintext ml-auto">
                    {project.budget}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Calendar size={15} className="text-accent" /> Start
                  <span className="text-maintext ml-auto">
                    {formatDate(project.startDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Calendar size={15} className="text-accent" /> End
                  <span className="text-maintext ml-auto">
                    {formatDate(project.endDate)}
                  </span>
                </div>
                <div className="pt-3 border-t border-line text-xs text-secondary space-y-1">
                  <p>Created {formatDate(project.createdDate)}</p>
                  <p>Updated {formatDate(project.updatedDate)}</p>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="font-display font-semibold text-maintext mb-3 flex items-center gap-2">
                <Flag size={16} className="text-accent" /> Milestones
              </h2>
              <p className="text-sm text-secondary mb-2">
                {milestonesDone} of {project.milestones.length} completed
              </p>
              <ProgressBar
              value={
              project.milestones.length ?
              Math.round(
                milestonesDone / project.milestones.length * 100
              ) :
              0
              } />
            
            </Card>
          </div>
        </div>
      }

      {tab === 'Tasks' &&
      <Card className="overflow-hidden">
          <div className="divide-y divide-line">
            {pTasks.length === 0 &&
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Tasks for this project will appear here." />

          }
            {pTasks.map((t) => {
            const assignee = users.find((u) => u.id === t.assigneeId);
            return (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="flex items-center gap-3 p-4 hover:bg-bg transition-colors flex-wrap sm:flex-nowrap">
                
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-maintext truncate">{t.title}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      Due {formatDate(t.dueDate)}
                    </p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  {assignee &&
                <Avatar
                  name={assignee.name}
                  color={assignee.avatarColor}
                  size="sm" />

                }
                  <StatusBadge status={t.status} />
                </Link>);

          })}
          </div>
        </Card>
      }

      {tab === 'Milestones' &&
      <Card className="p-6">
          {project.milestones.length === 0 &&
        <EmptyState
          icon={Flag}
          title="No milestones"
          description="Milestones for this project will appear here." />

        }
          <div className="space-y-4">
            {project.milestones.map((m) =>
          <div
            key={m.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-bg border border-line">
            
                <span
              className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                m.completed ?
                'bg-accent text-black' :
                'border border-line text-secondary'
              )}>
              
                  <Flag size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                className={cn(
                  'text-sm font-medium',
                  m.completed ?
                  'text-secondary line-through' :
                  'text-maintext'
                )}>
                
                    {m.name}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Due {formatDate(m.dueDate)}
                  </p>
                </div>
                <Badge variant={m.completed ? 'accent' : 'neutral'}>
                  {m.completed ? 'Completed' : 'Upcoming'}
                </Badge>
              </div>
          )}
          </div>
        </Card>
      }

      {tab === 'Timeline' &&
      <Card className="p-6">
          {timelineItems.length === 0 &&
        <EmptyState
          icon={Calendar}
          title="No timeline items"
          description="Milestones and sprints will appear here." />

        }
          <ol className="relative border-l border-line ml-3 space-y-6">
            {timelineItems.map((item) =>
          <li key={item.id} className="ml-6">
                <span
              className={cn(
                'absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full border-2 border-card',
                item.done ? 'bg-accent' : 'bg-bg border-line'
              )}
              aria-hidden="true" />
            
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                variant={item.type === 'Milestone' ? 'outline' : 'neutral'}>
                
                    {item.type}
                  </Badge>
                  <span className="text-xs text-secondary">
                    {formatDate(item.date)}
                  </span>
                </div>
                <p className="text-sm text-maintext mt-1.5">{item.name}</p>
              </li>
          )}
          </ol>
        </Card>
      }

      {tab === 'Team' &&
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) =>
        <Card key={m.id} className="p-5 flex items-center gap-4">
              <Avatar name={m.name} color={m.avatarColor} size="lg" />
              <div className="min-w-0">
                <p className="font-medium text-maintext truncate">{m.name}</p>
                <p className="text-sm text-secondary truncate">
                  {m.department} · {m.city}
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  {m.id === project.managerId ? 'Project Manager' : m.role}
                </p>
              </div>
            </Card>
        )}
        </div>
      }
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <AppLayout>
      <ProjectDetails />
    </AppLayout>
  );
}

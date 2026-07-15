import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, FolderKanban, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getProjects } from '../lib/api';
import { projectProgressFrom } from '../lib/projectUtils';
import { formatDate, cn } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton, useSimulatedLoading } from '../components/ui/Skeleton';
import { ProjectStatus } from '../types';
import { AppLayout } from '../components/layout/AppLayout';
const statusFilters: (ProjectStatus | 'All')[] = [
'All',
'Planning',
'Active',
'Completed',
'Archived'];

export function Projects() {
  const { currentUser } = useAuth();
  const { projects, users, tasks } = useData();
  const router = useRouter();
  const loading = useSimulatedLoading(500);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All');
  const canCreate =
  currentUser?.role === 'Project Manager' ||
  currentUser?.role === 'Administrator';
  const isMember = currentUser?.role === 'Team Member';
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setFetching(true);
    getProjects({
      search: query,
      status: status === 'All' ? undefined : status,
      perPage: 100
    })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) setProjects(res.data);
      })
      .catch((error) => {
        console.error('Failed to load projects', error);
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });
    return () => {
      isMounted = false;
    };
  }, [query, status, setProjects]);

  let list = isMember ?
  projects.filter((p) => p.memberIds.includes(currentUser!.id)) :
  projects;
  list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  if (status !== 'All') list = list.filter((p) => p.status === status);
  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={
        isMember ?
        'Projects you are assigned to' :
        'Manage and monitor all projects'
        }
        action={
        canCreate &&
        <Button onClick={() => router.push('/projects/new')}>
              <Plus size={16} /> New project
            </Button>

        } />
      

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="max-w-xs w-full">
          <Input
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search projects" />
          
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) =>
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors',
              status === s ?
              'bg-accent text-black' :
              'bg-card border border-line text-secondary hover:border-accent'
            )}>
            
              {s}
            </button>
          )}
        </div>
      </div>

      {loading || fetching ?
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) =>
        <CardSkeleton key={i} />
        )}
        </div> :
      list.length === 0 ?
      <Card>
          <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try a different search or filter, or create a new project." />
        
        </Card> :

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {list.map((p) => {
          const members = users.filter((u) => p.memberIds.includes(u.id));
          const pTasks = tasks.filter((t) => t.projectId === p.id);
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="p-6 h-full hover:border-accent transition-colors flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-bg border border-line flex items-center justify-center text-accent">
                      <FolderKanban size={18} />
                    </div>
                    <Badge
                    variant={
                    p.status === 'Active' ?
                    'accent' :
                    p.status === 'Completed' ?
                    'outline' :
                    'neutral'
                    }>
                    
                      {p.status}
                    </Badge>
                  </div>
                  <h3 className="font-display font-semibold text-maintext mt-4">
                    {p.name}
                  </h3>
                  <p className="text-sm text-secondary mt-1 line-clamp-2 flex-1">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar value={projectProgressFrom(tasks, p.id)} />
                    </div>
                    <span className="text-sm font-display font-bold text-accent">
                      {projectProgressFrom(tasks, p.id)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((m) =>
                    <Avatar
                      key={m.id}
                      name={m.name}
                      color={m.avatarColor}
                      size="sm"
                      className="ring-2 ring-card" />

                    )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <Calendar size={12} /> {formatDate(p.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-3">
                    {pTasks.length} tasks · {p.milestones.length} milestones
                  </p>
                </Card>
              </Link>);

        })}
        </div>
      }
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AppLayout>
      <Projects />
    </AppLayout>
  );
}

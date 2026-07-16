import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, CheckSquare, ArrowUpDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createTask as createTaskApi, deleteTask as deleteTaskApi } from '../lib/api';
import { TaskStatus, TaskPriority } from '../types';
import { formatDate, cn } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/Spinner';
const statusFilters: (TaskStatus | 'All')[] = [
'All',
'Todo',
'In Progress',
'Review',
'Completed'];

const priorityFilters: (TaskPriority | 'All')[] = [
'All',
'Low',
'Medium',
'High',
'Urgent'];

const PAGE_SIZE = 8;
type SortKey = 'title' | 'dueDate' | 'priority';
const priorityOrder: Record<TaskPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3
};
export function Tasks() {
  const { currentUser } = useAuth();
  const { tasks, users, projects, setTasks } = useData();
  const isManager = currentUser?.role === 'Project Manager';
  const isMember = currentUser?.role === 'Team Member';
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>(
    'All'
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: 'u3',
    projectId: 'p1',
    priority: 'Medium' as TaskPriority,
    dueDate: ''
  });
  const [errors, setErrors] = useState<{
    title?: string;
    dueDate?: string;
  }>({});
  const filtered = useMemo(() => {
    let list = isMember ?
    tasks.filter((t) => t.assigneeId === currentUser?.id) :
    tasks;
    if (statusFilter !== 'All')
    list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'All')
    list = list.filter((t) => t.priority === priorityFilter);
    if (projectFilter !== 'all')
    list = list.filter((t) => t.projectId === projectFilter);
    if (assigneeFilter !== 'all')
    list = list.filter((t) => t.assigneeId === assigneeFilter);
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);else
      if (sortKey === 'dueDate') cmp = a.dueDate.localeCompare(b.dueDate);else
      cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      return sortAsc ? cmp : -cmp;
    });
  }, [
  tasks,
  isMember,
  currentUser,
  statusFilter,
  priorityFilter,
  projectFilter,
  assigneeFilter,
  sortKey,
  sortAsc]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);else
    {
      setSortKey(key);
      setSortAsc(true);
    }
  };
  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Task title is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const createTask = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const priorityMap: Record<string, number> = { Low: 1, Medium: 2, High: 3, Urgent: 4 };
      const payload = {
        project_id: form.projectId,
        title: form.title,
        description: form.description,
        assignee_id: form.assigneeId,
        priority: priorityMap[form.priority] ?? 2,
        due_date: form.dueDate
      };
      const task = await createTaskApi(payload);
      setTasks((ts) => [task, ...ts]);
      setModalOpen(false);
      setForm({
        title: '',
        description: '',
        assigneeId: users.find(u => u.role !== 'Administrator')?.id || '',
        projectId: projects[0]?.id || '',
        priority: 'Medium',
        dueDate: ''
      });
      toast.success('Task created successfully');
    } catch (err) {
      console.error('Failed to create task', err);
      toast.error('Unable to create task');
    } finally {
      setSaving(false);
    }
  };
  const deleteTask = async () => {
    if (!deleteId) return;
    try {
      await deleteTaskApi(deleteId);
      setTasks((ts) => ts.filter((t) => t.id !== deleteId));
      toast.success('Task deleted');
    } catch (err) {
      console.error('Failed to delete task', err);
      toast.error('Unable to delete task');
    } finally {
      setDeleteId(null);
    }
  };
  return (
    <div>
      <PageHeader
        title={isMember ? 'My Tasks' : 'Task Management'}
        subtitle={
        isMember ?
        'Track and update your assigned work' :
        'Create and monitor tasks across projects'
        }
        action={
        isManager &&
        <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> New task
            </Button>

        } />
      

      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map((s) =>
        <button
          key={s}
          onClick={() => {
            setStatusFilter(s);
            setPage(1);
          }}
          className={cn(
            'text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors',
            statusFilter === s ?
            'bg-accent text-black' :
            'bg-card border border-line text-secondary hover:border-accent'
          )}>
          
            {s === 'Todo' ? 'To Do' : s}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-3xl">
        <Select
          label="Priority"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as TaskPriority | 'All');
            setPage(1);
          }}>
          
          {priorityFilters.map((p) =>
          <option key={p}>{p}</option>
          )}
        </Select>
        <Select
          label="Project"
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
          }}>
          
          <option value="all">All</option>
          {projects.map((p) =>
          <option key={p.id} value={p.id}>
              {p.name}
            </option>
          )}
        </Select>
        {!isMember &&
        <Select
          label="Assignee"
          value={assigneeFilter}
          onChange={(e) => {
            setAssigneeFilter(e.target.value);
            setPage(1);
          }}>
          
            <option value="all">All</option>
            {users.
          filter((u) => u.role !== 'Administrator').
          map((u) =>
          <option key={u.id} value={u.id}>
                  {u.name}
                </option>
          )}
          </Select>
        }
      </div>

      {filtered.length === 0 ?
      <Card>
          <EmptyState
          icon={CheckSquare}
          title="No tasks here"
          description="Nothing matches these filters right now." />
        
        </Card> :

      <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-line text-xs uppercase tracking-wide text-secondary">
                  <th className="px-5 py-3 font-medium">
                    <button
                    onClick={() => toggleSort('title')}
                    className="flex items-center gap-1 hover:text-accent">
                    
                      Task <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">
                    Project
                  </th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">
                    Assignee
                  </th>
                  <th className="px-5 py-3 font-medium">
                    <button
                    onClick={() => toggleSort('priority')}
                    className="flex items-center gap-1 hover:text-accent">
                    
                      Priority <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">
                    <button
                    onClick={() => toggleSort('dueDate')}
                    className="flex items-center gap-1 hover:text-accent">
                    
                      Due <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {isManager &&
                <th className="px-5 py-3 font-medium text-right">
                      Actions
                    </th>
                }
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageItems.map((t) => {
                const assignee = users.find((u) => u.id === t.assigneeId);
                const project = projects.find((p) => p.id === t.projectId);
                return (
                  <tr key={t.id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3">
                        <Link
                        href={`/tasks/${t.id}`}
                        className="text-sm font-medium text-maintext hover:text-accent">
                        
                          {t.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary hidden lg:table-cell">
                        {project?.name}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {assignee &&
                        <Avatar
                          name={assignee.name}
                          color={assignee.avatarColor}
                          size="sm" />

                        }
                          <span className="text-sm text-secondary whitespace-nowrap">
                            {assignee?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-5 py-3 text-sm text-secondary hidden sm:table-cell whitespace-nowrap">
                        {formatDate(t.dueDate)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      {isManager &&
                    <td className="px-5 py-3 text-right">
                          <button
                        onClick={() => setDeleteId(t.id)}
                        aria-label={`Delete ${t.title}`}
                        className="p-2 rounded-lg text-secondary hover:text-red-500 hover:bg-card">
                        
                            <Trash2 size={15} />
                          </button>
                        </td>
                    }
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </Card>
      }

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create task"
        footer={
        <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTask} disabled={saving}>
              {saving && <Spinner size={14} />}{' '}
              {saving ? 'Creating…' : 'Create task'}
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <Input
            label="Task title"
            placeholder="e.g. Implement citizen search"
            value={form.title}
            onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value
            })
            }
            error={errors.title} />
          
          <Textarea
            label="Description"
            rows={3}
            placeholder="Describe the task…"
            value={form.description}
            onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value
            })
            } />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assignee"
              value={form.assigneeId}
              onChange={(e) =>
              setForm({
                ...form,
                assigneeId: e.target.value
              })
              }>
              
              {users.
              filter((u) => u.role !== 'Administrator').
              map((u) =>
              <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
              )}
            </Select>
            <Select
              label="Project"
              value={form.projectId}
              onChange={(e) =>
              setForm({
                ...form,
                projectId: e.target.value
              })
              }>
              
              {projects.map((p) =>
              <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              )}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value as TaskPriority
              })
              }>
              
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </Select>
            <Input
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) =>
              setForm({
                ...form,
                dueDate: e.target.value
              })
              }
              error={errors.dueDate} />
            
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteTask}
        title="Delete task"
        message="This task and all its comments and attachments will be permanently removed. This action cannot be undone." />
      
    </div>
  );
}

export default function TasksPage() {
  return (
    <AppLayout>
      <Tasks />
    </AppLayout>
  );
}

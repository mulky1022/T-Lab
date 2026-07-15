import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createProject } from '../lib/api';
import { ProjectStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { AppLayout } from '../components/layout/AppLayout';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';
export function CreateProject() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { users, setProjects } = useData();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    budget: '',
    status: 'Planning' as ProjectStatus,
    start: '',
    end: ''
  });
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    start?: string;
    end?: string;
  }>({});
  const teamPool = users.filter(
    (u) => u.role !== 'Administrator' && u.status === 'Active'
  );
  const toggle = (id: string) =>
  setSelected((s) =>
  s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
  );
  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.start) e.start = 'Start date is required';
    if (!form.end) e.end = 'End date is required';else
    if (form.start && form.end < form.start)
    e.end = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        manager_id: currentUser?.id,
        member_ids: [currentUser?.id, ...selected].filter(Boolean),
        budget: form.budget || 'TBC',
        status: form.status,
        start_date: form.start,
        end_date: form.end,
        milestones: [],
        sprints: []
      };
      const project = await createProject(payload);
      setProjects((ps) => [...ps, project]);
      toast.success('Project created successfully');
      router.push('/projects');
    } catch (error) {
      toast.error('Unable to create project.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create project"
        subtitle="Set up a new project and assign your team" />
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Project name"
            placeholder="e.g. Smart Galle Initiative"
            value={form.name}
            onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
            }
            error={errors.name} />
          
          <Textarea
            label="Description"
            rows={4}
            placeholder="What is this project about?"
            value={form.description}
            onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value
            })
            } />
          
          {errors.description &&
          <p className="-mt-4 text-xs text-red-500">{errors.description}</p>
          }
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start date"
              type="date"
              value={form.start}
              onChange={(e) =>
              setForm({
                ...form,
                start: e.target.value
              })
              }
              error={errors.start} />
            
            <Input
              label="End date"
              type="date"
              value={form.end}
              onChange={(e) =>
              setForm({
                ...form,
                end: e.target.value
              })
              }
              error={errors.end} />
            
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Budget (optional)"
              placeholder="e.g. LKR 25,000,000"
              value={form.budget}
              onChange={(e) =>
              setForm({
                ...form,
                budget: e.target.value
              })
              } />
            
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as ProjectStatus
              })
              }>
              
              <option>Planning</option>
              <option>Active</option>
            </Select>
          </div>

          <div>
            <span className="block text-sm font-medium text-secondary mb-2">
              Assign team members
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamPool.map((u) =>
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                aria-pressed={selected.includes(u.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                  selected.includes(u.id) ?
                  'border-accent bg-accent/10' :
                  'border-line bg-bg hover:border-accent'
                )}>
                
                  <Avatar name={u.name} color={u.avatarColor} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm text-maintext truncate">{u.name}</p>
                    <p className="text-xs text-secondary truncate">
                      {u.department} · {u.city}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/projects')}>
              
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} /> : null}
              {saving ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>);

}

export default function CreateProjectPage() {
  return (
    <AppLayout>
      <CreateProject />
    </AppLayout>
  );
}

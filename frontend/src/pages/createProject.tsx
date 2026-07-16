import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { CalendarRange, FolderKanban, ShieldAlert, Sparkles, Users } from 'lucide-react';
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

const initialForm = {
  name: '',
  description: '',
  budget: '',
  status: 'Planning' as ProjectStatus,
  start: '',
  end: ''
};

export function CreateProject() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { users, setProjects } = useData();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    start?: string;
    end?: string;
  }>({});

  const teamPool = useMemo(
    () => users.filter((u) => u.role !== 'Administrator' && u.status === 'Active'),
    [users]
  );
  const selectedMembers = useMemo(
    () => teamPool.filter((u) => selected.includes(u.id)),
    [selected, teamPool]
  );
  const canManageProjects =
    currentUser?.role === 'Administrator' || currentUser?.role === 'Project Manager';
  const memberIds = [currentUser?.id, ...selected].filter(Boolean) as string[];

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = 'Project name is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (!form.start) nextErrors.start = 'Start date is required';
    if (!form.end) nextErrors.end = 'End date is required';
    else if (form.start && form.end < form.start) nextErrors.end = 'End date must be after start date';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser?.id) {
      toast.error('You need to be signed in to create a project.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        manager_id: currentUser.id,
        member_ids: [...new Set(memberIds)],
        budget: form.budget.trim() || 'TBC',
        status: form.status,
        start_date: form.start,
        end_date: form.end,
        milestones: [],
        sprints: []
      };

      const project = await createProject(payload);
      setProjects((ps) => [project, ...ps]);
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
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Create project"
        subtitle="Set up a new project, invite the right people, and keep it visible to your team."
      />

      {!canManageProjects ? (
        <Card className="border border-amber-400/30 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/20 p-2 text-amber-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-maintext">Project creation is restricted</h2>
              <p className="mt-1 text-sm text-secondary">
                Only administrators and project managers can create new projects in this workspace.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="rounded-2xl border border-line bg-bg/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-maintext">
                  <Sparkles size={16} className="text-accent" />
                  Project details
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="Project name"
                    placeholder="e.g. Smart Galle Initiative"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={errors.name}
                  />

                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                  >
                    <option>Planning</option>
                    <option>Active</option>
                    <option>Completed</option>
                    <option>Archived</option>
                  </Select>
                </div>
              </div>

              <Textarea
                label="Description"
                rows={4}
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {errors.description && <p className="-mt-2 text-xs text-red-500">{errors.description}</p>}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Start date"
                  type="date"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  error={errors.start}
                />

                <Input
                  label="End date"
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  error={errors.end}
                />
              </div>

              <Input
                label="Budget (optional)"
                placeholder="e.g. LKR 25,000,000"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />

              <div className="rounded-2xl border border-line bg-bg/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-maintext">Assign team members</h3>
                    <p className="mt-1 text-sm text-secondary">
                      Choose who should see and contribute to this project.
                    </p>
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {selectedMembers.length} selected
                  </span>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {teamPool.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggle(u.id)}
                      aria-pressed={selected.includes(u.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                        selected.includes(u.id)
                          ? 'border-accent bg-accent/10'
                          : 'border-line bg-bg hover:border-accent'
                      )}
                    >
                      <Avatar name={u.name} color={u.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-maintext">{u.name}</p>
                        <p className="truncate text-xs text-secondary">
                          {u.department} · {u.city}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => router.push('/projects')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Spinner size={16} /> : null}
                  {saving ? 'Creating…' : 'Create project'}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-line bg-bg p-2 text-accent">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-maintext">Project preview</h3>
                  <p className="text-sm text-secondary">This will be visible to the creator and selected members.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-line bg-bg/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <CalendarRange size={14} /> Timeline
                  </div>
                  <p className="mt-2 text-sm text-maintext">
                    {form.start || 'Start date'} → {form.end || 'End date'}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-bg/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <Users size={14} /> Visibility
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentUser && (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent">
                        {currentUser.name}
                      </span>
                    )}
                    {selectedMembers.map((member) => (
                      <span key={member.id} className="rounded-full border border-line bg-bg px-2.5 py-1 text-xs text-secondary">
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-maintext">
                <Sparkles size={16} className="text-accent" />
                Quick tips
              </div>
              <ul className="mt-3 space-y-2 text-sm text-secondary">
                <li>• Add the people who need to collaborate from the start.</li>
                <li>• Keep the description clear so the project stays easy to find.</li>
                <li>• Use the timeline to keep milestones and deadlines aligned.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <AppLayout>
      <CreateProject />
    </AppLayout>
  );
}

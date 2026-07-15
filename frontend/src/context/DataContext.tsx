import React, { useState, createContext, useContext, useEffect } from 'react';
import {
  Task,
  Project,
  User,
  AppNotification,
  AuditLog,
  TaskStatus,
  TaskComment } from
'../types';
import {
  tasks as seedTasks,
  notifications as seedNotifications,
  auditLogs as seedAuditLogs } from
'../data/mockData';
import { getProjects } from '../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function request(path: string, options: RequestInit = {}, auth = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

interface DataContextValue {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  auditLogs: AuditLog[];
  updateTaskStatus: (
  taskId: string,
  status: TaskStatus,
  actorId?: string)
  => void;
  addComment: (taskId: string, comment: TaskComment, parentId?: string) => void;
  editComment: (taskId: string, commentId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;
}
const DataContext = createContext<DataContextValue | undefined>(undefined);
export function DataProvider({ children }: {children: React.ReactNode;}) {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [notifications, setNotifications] =
  useState<AppNotification[]>(seedNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);

  useEffect(() => {
    // Load users from backend (Users module migrated first)
    (async () => {
      try {
        const res = await request('/users?perPage=1000', { method: 'GET' }, true);
        if (res && res.data) setUsers(res.data);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    })();

    (async () => {
      try {
        const res = await getProjects({ perPage: 1000 });
        if (res && res.data) setProjects(res.data);
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    })();
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await request(`/notifications/${id}/read`, { method: 'POST' }, true);
      setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await request('/notifications/read-all', { method: 'POST' }, true);
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  actorId = 'u1') => {
    try {
      const updated = await request(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status }) }, true);
      setTasks((ts) => ts.map((t) => t.id === taskId ? { ...updated } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (
  taskId: string,
  comment: TaskComment,
  parentId?: string) => {
    try {
      const body: any = { task_id: taskId, text: comment.text };
      if (parentId) body.parent_id = parentId;
      const res = await request('/comments', { method: 'POST', body: JSON.stringify(body) }, true);
      // reload task comments for consistency
      const taskRes: any = await request(`/tasks/${taskId}`, { method: 'GET' }, true);
      setTasks((ts) => ts.map((t) => t.id === taskId ? taskRes : t));
    } catch (err) {
      console.error(err);
    }
  };

  const editComment = async (taskId: string, commentId: string, text: string) => {
    try {
      await request(`/comments/${commentId}`, { method: 'PUT', body: JSON.stringify({ text }) }, true);
      const taskRes: any = await request(`/tasks/${taskId}`, { method: 'GET' }, true);
      setTasks((ts) => ts.map((t) => t.id === taskId ? taskRes : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    try {
      await request(`/comments/${commentId}`, { method: 'DELETE' }, true);
      const taskRes: any = await request(`/tasks/${taskId}`, { method: 'GET' }, true);
      setTasks((ts) => ts.map((t) => t.id === taskId ? taskRes : t));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        users,
        setUsers,
        projects,
        setProjects,
        tasks,
        setTasks,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        auditLogs,
        updateTaskStatus,
        addComment,
        editComment,
        deleteComment
      }}>
      
      {children}
    </DataContext.Provider>);

}
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

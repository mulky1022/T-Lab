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
import { useAuth } from './AuthContext';
import { getProjects, getTasks, getUsers, getTask, createComment, updateComment as updateCommentApi, deleteComment as deleteCommentApi, getNotifications, getAuditLogs, markNotificationRead as markNotificationReadApi, markAllNotificationsRead as markAllNotificationsReadApi, updateTask } from '../lib/api';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] =
  useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const { currentUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setUsers([]);
      setProjects([]);
      setTasks([]);
      setNotifications([]);
      setAuditLogs([]);
      return;
    }

    // Load users from backend (Users module migrated first)
    (async () => {
      try {
        const res = await getUsers({ perPage: 1000 });
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

    (async () => {
      try {
        const res = await getTasks({ perPage: 1000 });
        if (res && res.data) setTasks(res.data);
      } catch (err) {
        console.error('Failed to load tasks', err);
      }
    })();

    (async () => {
      try {
        const res = await getNotifications({ perPage: 100 });
        if (res && res.data) setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    })();

    (async () => {
      try {
        const res = await getAuditLogs({ perPage: 100 });
        if (res && res.data) setAuditLogs(res.data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      }
    })();
  }, [authLoading, currentUser]);

  const markNotificationRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus) => {
    try {
      const updated = await updateTask(taskId, { status });
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
      await createComment(body);
      // reload task comments for consistency
      const taskRes: any = await getTask(taskId);
      setTasks((ts) => ts.map((t) => t.id === taskId ? taskRes : t));
    } catch (err) {
      console.error(err);
    }
  };

  const editComment = async (taskId: string, commentId: string, text: string) => {
    try {
      await updateCommentApi(commentId, { text });
      const taskRes: any = await getTask(taskId);
      setTasks((ts) => ts.map((t) => t.id === taskId ? taskRes : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    try {
      await deleteCommentApi(commentId);
      const taskRes: any = await getTask(taskId);
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

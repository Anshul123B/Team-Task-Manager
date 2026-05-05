// Team Task Manager — auth helper hook: reads user from localStorage and exposes permissions
import { useMemo } from 'react';


const PERMISSIONS = {
  admin: [
    'createProject',
    'updateProject',
    'deleteProject',
    'addMember',
    'createTask',
    'updateTask',
    'deleteTask',
    'updateTaskStatus',
    'viewAnalytics',
  ],
  member: [
    'createProject',
    'updateProject',   // controller enforces creator-only for non-admins
    'addMember',       // controller enforces creator-only for non-admins
    'createTask',
    'updateTask',
    'updateTaskStatus',
    'viewAnalytics',
  ],
};

const useAuth = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const role = user?.role || 'member';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';

  const can = (action) => {
    const perms = PERMISSIONS[role] || [];
    return perms.includes(action);
  };

  const canDeleteTask = (task) => {
    if (!user || !task) return false;
    return isAdmin || task.created_by?._id === user._id;
  };

  const canManageProject = (project) => {
    if (!user || !project) return false;
    return isAdmin || project.created_by?._id === user._id;
  };

  return { user, role, isAdmin, isMember, can, canDeleteTask, canManageProject };
};

export default useAuth;

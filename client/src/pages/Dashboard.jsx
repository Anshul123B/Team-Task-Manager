import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import useAuth from '../hooks/useAuth';
import {
  apiGetProjects, apiGetProject, apiCreateProject, apiAddMember,
  apiGetTasks, apiUpdateTaskStatus, apiDeleteTask
} from '../utils/api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('board');
  const [loadingTasks, setLoadingTasks] = useState(false);

  const navigate = useNavigate();
  const { user, isAdmin, canManageProject } = useAuth();

  const fetchProjects = useCallback(async () => {
    try {
      const data = await apiGetProjects();
      setProjects(data);
    } catch (err) {
      setProjects([
        { _id: '1', name: 'Demo Project', description: 'This is a demo project.' }
      ]);
    }
  }, []);

  const fetchProjectDetails = useCallback(async (id) => {
    try {
      const data = await apiGetProject(id);
      setSelectedProject(data);
    } catch {
      setSelectedProject({ _id: '1', name: 'Demo Project', description: 'This is a demo project.' });
    }
  }, []);

  const fetchTasks = useCallback(async (projectId) => {
    setLoadingTasks(true);
    try {
      const data = await apiGetTasks({ project_id: projectId });
      setTasks(data);
    } catch {
      setTasks([
        { _id: 't1', title: 'Demo Task 1', description: 'This is a demo task.', status: 'in-progress', assignee: 'Main User' },
        { _id: 't2', title: 'Demo Task 2', description: 'Another demo task.', status: 'done', assignee: 'Main User' }
      ]);
    }
    setLoadingTasks(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) fetchTasks(selectedProject._id);
  }, [selectedProject, fetchTasks]);

  const handleSelectProject = async (project) => {
    setActiveTab('board');
    setTasks([]);
    await fetchProjectDetails(project._id);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiCreateProject(newProject);
      setNewProject({ name: '', description: '' });
      setShowCreateProjectForm(false);
      await fetchProjects();
      handleSelectProject(data);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiAddMember(selectedProject._id, { email: memberEmail });
      setMemberEmail('');
      setShowAddMember(false);
      await fetchProjectDetails(selectedProject._id);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleTaskCreated = (newTask) => setTasks(prev => [newTask, ...(Array.isArray(prev) ? prev : [])]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const data = await apiUpdateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: data.status } : t));
    } catch {}
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiDeleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch {}
  };

  const isCreatorOrAdmin = canManageProject(selectedProject);

  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Team Task Manager</span>
          </div>
          {/* ── Page nav ── */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <Link
              to="/dashboard"
              className="text-sm px-4 py-1.5 rounded-lg bg-white shadow text-gray-900 font-semibold"
            >
              📋 Board
            </Link>
            <Link
              to="/analytics"
              className="text-sm px-4 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              📊 Analytics
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">{user.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects</span>
              <button
                onClick={() => setShowCreateProjectForm(!showCreateProjectForm)}
                className="w-6 h-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center text-lg leading-none transition-colors"
                title="New Project"
              >+</button>
            </div>

            {showCreateProjectForm && (
              <form onSubmit={handleCreateProject} className="space-y-2 mt-2">
                <input
                  type="text" required placeholder="Project name" value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text" placeholder="Description (optional)" value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700">Create</button>
                  <button type="button" onClick={() => setShowCreateProjectForm(false)} className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {projects.length === 0 && (
              <p className="text-xs text-gray-400 text-center pt-6">No projects yet.<br />Click + to create one.</p>
            )}
            {projects.map(p => (
              <button
                key={p._id}
                onClick={() => handleSelectProject(p)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${selectedProject?._id === p._id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <span className="block truncate font-medium">{p.name}</span>
                <span className="text-xs text-gray-400">{p.members?.length ?? 0} member{p.members?.length !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ─── Main ────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4 leading-none">&times;</button>
            </div>
          )}

          {!selectedProject ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
              <div className="text-7xl mb-4">📋</div>
              <p className="text-xl font-semibold text-gray-500">Select a project to get started</p>
              <p className="text-sm mt-1">or create a new one from the sidebar</p>
            </div>
          ) : (
            <>
              {/* Project header */}
              <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h1>
                  {selectedProject.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{selectedProject.description}</p>
                  )}
                  {/* Stats pills */}
                  <div className="flex gap-3 mt-3">
                    {[
                      { label: 'Total', val: taskStats.total, color: 'text-gray-700', bg: 'bg-gray-100' },
                      { label: 'In Progress', val: taskStats.inProgress, color: 'text-blue-700', bg: 'bg-blue-50' },
                      { label: 'Done', val: taskStats.done, color: 'text-green-700', bg: 'bg-green-50' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl px-4 py-2 text-center shadow-sm border border-white`}>
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-start flex-wrap">
                  {/* Tab toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {['board', 'members'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tab === 'board' ? '📋 Board' : `👥 Members (${selectedProject.members?.length ?? 0})`}
                      </button>
                    ))}
                  </div>
                  {/* Action button */}
                  {activeTab === 'board' && (
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
                    >
                      + Add Task
                    </button>
                  )}
                  {activeTab === 'members' && isCreatorOrAdmin && (
                    <button
                      onClick={() => setShowAddMember(!showAddMember)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
                    >
                      + Add Member
                    </button>
                  )}
                </div>
              </div>

              {/* Add Member inline form */}
              {activeTab === 'members' && showAddMember && isCreatorOrAdmin && (
                <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                  <input
                    type="email" required placeholder="Enter team member's email…" value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button type="submit" className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                    Invite
                  </button>
                </form>
              )}

              {/* ── Board Tab ─────────────────────────────────────────────── */}
              {activeTab === 'board' && (
                loadingTasks
                  ? <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading tasks…</div>
                  : <KanbanBoard
                      tasks={tasks}
                      onStatusChange={handleStatusChange}
                      onDeleteTask={handleDeleteTask}
                    />
              )}

              {/* ── Members Tab ───────────────────────────────────────────── */}
              {activeTab === 'members' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedProject.members?.map(m => (
                        <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
                                {m.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500">{m.email}</td>
                          <td className="px-5 py-3">
                            {m._id === selectedProject.created_by?._id
                              ? <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">Creator</span>
                              : isAdmin
                                ? <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
                                : <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">Member</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ─── Task Modal ──────────────────────────────────────────────────────── */}
      {showTaskModal && selectedProject && (
        <TaskModal
          projectId={selectedProject._id}
          projectMembers={selectedProject.members}
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;

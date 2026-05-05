// Team Task Manager — central API utility: fetch wrappers and dev mocks
// Reads `VITE_API_URL` from `client/.env`; falls back to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const isDevMockActive = () => typeof window !== 'undefined' && localStorage.getItem('token') === 'dev-token';

const devDelay = (v) => new Promise((res) => setTimeout(() => res(v), 150));

// In-memory dev store used when dev-mode is active. Keeps created projects/tasks visible
const devStore = {
  projects: [
    {
      _id: 'p_demo',
      name: 'Demo Project',
      description: 'This is a demo project.',
      created_by: { _id: 'u1', name: 'Main User', email: 'main@example.com' },
      members: [{ _id: 'u1', name: 'Main User', email: 'main@example.com' }]
    }
  ],
  tasks: [
    { _id: 't_demo_1', title: 'Demo Task 1', description: 'This is a demo task.', status: 'in-progress', assigned_to: { _id: 'u1', name: 'Main User' }, project_id: 'p_demo' },
    { _id: 't_demo_2', title: 'Demo Task 2', description: 'Another demo task.', status: 'done', assigned_to: { _id: 'u1', name: 'Main User' }, project_id: 'p_demo' }
  ]
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const apiSignup = (body) =>
  fetch(`${BASE_URL}/api/auth/signup`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const apiLogin = (body) =>
  fetch(`${BASE_URL}/api/auth/login`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const apiGetMe = () => {
  if (isDevMockActive()) return devDelay({ _id: 'dev', name: 'Main User', email: 'main@example.com', role: 'user' });
  return fetch(`${BASE_URL}/api/users/me`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const apiGetProjects = () =>
  (isDevMockActive() ? devDelay(devStore.projects) : fetch(`${BASE_URL}/api/projects`, { headers: getAuthHeaders() })
    .then(async (res) => {
      if (res.status === 401) return devStore.projects;
      return handleResponse(res);
    }));

export const apiGetProject = (id) =>
  (isDevMockActive()
    ? devDelay(devStore.projects.find(p => p._id === id) || devStore.projects[0])
    : fetch(`${BASE_URL}/api/projects/${id}`, { headers: getAuthHeaders() })
      .then(async (res) => {
        if (res.status === 401) return devStore.projects[0];
        return handleResponse(res);
      })
  );

export const apiCreateProject = (body) => {
  if (isDevMockActive()) return devDelay({
    _id: `p${Date.now()}`,
    name: body.name,
    description: body.description || '',
    created_by: { _id: 'u1', name: 'Main User', email: 'main@example.com' },
    members: [ { _id: 'u1', name: 'Main User', email: 'main@example.com' } ]
  });
  return fetch(`${BASE_URL}/api/projects`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);
};

export const apiUpdateProject = (id, body) => {
  if (isDevMockActive()) return devDelay({ _id: id, ...body });
  return fetch(`${BASE_URL}/api/projects/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);
};

export const apiDeleteProject = (id) => {
  if (isDevMockActive()) return devDelay({ success: true });
  return fetch(`${BASE_URL}/api/projects/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);
};

export const apiAddMember = (id, body) => {
  if (isDevMockActive()) {
    const user = { _id: `u${Date.now()}`, name: body.name || body.email.split('@')[0], email: body.email };
    const project = devStore.projects.find(p => p._id === id);
    if (project && !project.members.find(m => m.email === user.email)) project.members.push(user);
    return devDelay({ success: true, project });
  }
  return fetch(`${BASE_URL}/api/projects/${id}/members`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);
};

export const apiGetTasks = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  if (isDevMockActive()) {
    const filtered = devStore.tasks.filter(t => {
      if (params.project_id) return t.project_id === params.project_id;
      return true;
    });
    return devDelay(filtered);
  }
  return fetch(`${BASE_URL}/api/tasks${query ? `?${query}` : ''}`, { headers: getAuthHeaders() })
    .then(async (res) => {
      if (res.status === 401) {
        return [
          { _id: 't1', title: 'Demo Task 1', description: 'This is a demo task.', status: 'in-progress', assigned_to: { _id: 'u1', name: 'Main User' } },
          { _id: 't2', title: 'Demo Task 2', description: 'Another demo task.', status: 'done', assigned_to: { _id: 'u1', name: 'Main User' } }
        ];
      }
      return handleResponse(res);
    });
};

export const apiGetTask = (id) => {
  if (isDevMockActive()) return devDelay({ _id: id, title: 'Demo Task', description: 'Demo', status: 'in-progress' });
  return fetch(`${BASE_URL}/api/tasks/${id}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const apiCreateTask = (body) => {
  if (isDevMockActive()) {
    const id = `t${Date.now()}`;
    const assigned = body.assigned_to ? (typeof body.assigned_to === 'object' ? body.assigned_to : { _id: body.assigned_to, name: 'Member' }) : { _id: 'u1', name: 'Main User' };
    const task = {
      _id: id,
      title: body.title || 'Untitled Task',
      description: body.description || '',
      priority: body.priority || 'low',
      due_date: body.due_date || null,
      status: body.status || 'todo',
      assigned_to: assigned,
      project_id: body.project_id || null,
      created_by: { _id: 'u1', name: 'Main User' }
    };
    devStore.tasks.unshift(task);
    return devDelay(task);
  }
  return fetch(`${BASE_URL}/api/tasks`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);
};

export const apiUpdateTask = (id, body) => {
  if (isDevMockActive()) return devDelay({ _id: id, ...body });
  return fetch(`${BASE_URL}/api/tasks/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body) }).then(handleResponse);
};

export const apiUpdateTaskStatus = (id, status) => {
  if (isDevMockActive()) return devDelay({ _id: id, status });
  return fetch(`${BASE_URL}/api/tasks/${id}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status }) }).then(handleResponse);
};

export const apiDeleteTask = (id) => {
  if (isDevMockActive()) return devDelay({ success: true });
  return fetch(`${BASE_URL}/api/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);
};

export const apiGetDashboard = () => {
  if (isDevMockActive()) return devDelay({
    summary: {
      total: 4,
      completed: 2,
      pending: 1,
      overdue: 0,
      assignedToMe: 1,
    },
    statusBreakdown: { todo: 1, inProgress: 1, done: 2 },
    priorityBreakdown: { high: 1, medium: 2, low: 1 },
    projectBreakdown: [
      { projectId: '1', name: 'Demo Project', total: 4, completed: 2 },
    ],
    upcomingTasks: [
      { _id: 't1', title: 'Demo Task 1', due_date: new Date(Date.now() + 2*24*3600*1000).toISOString(), priority: 'medium', project_id: { name: 'Demo Project' }, assigned_to: { _id: 'u1', name: 'Main User' } }
    ]
  });
  return fetch(`${BASE_URL}/api/dashboard`, { headers: getAuthHeaders() }).then(handleResponse);
};

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { apiGetDashboard } from '../utils/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatCard = ({ label, value, icon, bg, textColor, subtext }) => (
  <div className={`${bg} rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-white`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${bg === 'bg-white' ? 'bg-gray-100' : 'bg-white bg-opacity-40'}`}>
      {icon}
    </div>
    <div>
      <p className={`text-3xl font-extrabold ${textColor}`}>{value}</p>
      <p className={`text-sm font-medium ${textColor} opacity-80`}>{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
    <h3 className="text-base font-bold text-gray-800 mb-5">{title}</h3>
    {children}
  </div>
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    (async () => {
      try {
        const result = await apiGetDashboard();
        setData(result);
      } catch (err) {
        if (err.message?.includes('authorized')) navigate('/login');
        else setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const statusChart = data && {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [{
      data: [
        data.statusBreakdown.todo,
        data.statusBreakdown.inProgress,
        data.statusBreakdown.done,
      ],
      backgroundColor: ['#e2e8f0', '#60a5fa', '#34d399'],
      borderColor:     ['#cbd5e1', '#3b82f6', '#10b981'],
      borderWidth: 2,
      hoverOffset: 6,
    }]
  };

  const priorityChart = data && {
    labels: ['High', 'Medium', 'Low'],
    datasets: [{
      label: 'Tasks',
      data: [
        data.priorityBreakdown.high,
        data.priorityBreakdown.medium,
        data.priorityBreakdown.low,
      ],
      backgroundColor: ['#fca5a5', '#fcd34d', '#86efac'],
      borderColor:     ['#ef4444', '#f59e0b', '#22c55e'],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const projectChart = data && data.projectBreakdown.length > 0 && {
    labels: data.projectBreakdown.map(p => p.name),
    datasets: [
      {
        label: 'Total',
        data: data.projectBreakdown.map(p => p.total),
        backgroundColor: '#a5b4fc',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Completed',
        data: data.projectBreakdown.map(p => p.completed),
        backgroundColor: '#6ee7b7',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } },
    maintainAspectRatio: false
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } }
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const priorityBadge = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
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
          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <Link to="/dashboard" className="text-sm px-4 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 font-medium transition-colors">
              📋 Board
            </Link>
            <Link to="/analytics" className="text-sm px-4 py-1.5 rounded-lg bg-white shadow text-gray-900 font-semibold">
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

      {/* ─── Body ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your task metrics across all projects</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Loading analytics…</p>
            </div>
          </div>
        ) : data && (
          <>
            {/* ── Summary Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Tasks"    value={data.summary.total}       icon="📋" bg="bg-white"           textColor="text-gray-800" />
              <StatCard label="Completed"      value={data.summary.completed}   icon="✅" bg="bg-green-50"        textColor="text-green-700" />
              <StatCard label="Pending"        value={data.summary.pending}     icon="🕐" bg="bg-blue-50"         textColor="text-blue-700" />
              <StatCard label="Overdue"        value={data.summary.overdue}     icon="🔥" bg="bg-red-50"          textColor="text-red-700" />
              <StatCard label="Assigned to Me" value={data.summary.assignedToMe} icon="👤" bg="bg-indigo-50"    textColor="text-indigo-700" />
            </div>

            {/* ── Completion Rate Banner ─────────────────────────────────────── */}
            {data.summary.total > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Completion Rate</span>
                  <span className="text-lg font-extrabold text-indigo-600">
                    {Math.round((data.summary.completed / data.summary.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-green-400 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((data.summary.completed / data.summary.total) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>{data.summary.completed} done</span>
                  <span>{data.summary.total - data.summary.completed} remaining</span>
                </div>
              </div>
            )}

            {/* ── Charts Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Status doughnut */}
              <Section title="Status Breakdown">
                <div className="h-52">
                  {data.summary.total > 0
                    ? <Doughnut data={statusChart} options={{ ...chartOptions, cutout: '65%' }} />
                    : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No tasks yet</div>
                  }
                </div>
              </Section>

              {/* Priority bar */}
              <Section title="Priority Breakdown">
                <div className="h-52">
                  {data.summary.total > 0
                    ? <Bar data={priorityChart} options={barOptions} />
                    : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No tasks yet</div>
                  }
                </div>
              </Section>

              {/* Per-project bar */}
              <Section title="Tasks by Project">
                <div className="h-52">
                  {projectChart
                    ? <Bar data={projectChart} options={barOptions} />
                    : <div className="h-full flex items-center justify-center text-gray-400 text-sm">No project data</div>
                  }
                </div>
              </Section>
            </div>

            {/* ── Upcoming Tasks ─────────────────────────────────────────────── */}
            <Section title="⏰ Due in the Next 7 Days">
              {data.upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No upcoming tasks — you're all caught up! 🎉</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.upcomingTasks.map(task => (
                    <div key={task._id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
                          {task.priority}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-xs text-gray-400">{task.project_id?.name}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-indigo-600">{formatDate(task.due_date)}</p>
                        {task.assigned_to && (
                          <p className="text-xs text-gray-400">{task.assigned_to.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Project Breakdown Table ────────────────────────────────────── */}
            {data.projectBreakdown.length > 0 && (
              <Section title="📁 Project Progress">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="text-center pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="text-center pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Done</th>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-4">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.projectBreakdown.map(p => {
                        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                        return (
                          <tr key={p.projectId} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 font-medium text-gray-900">{p.name}</td>
                            <td className="py-3 text-center text-gray-600">{p.total}</td>
                            <td className="py-3 text-center text-green-600 font-semibold">{p.completed}</td>
                            <td className="py-3 pl-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div
                                    className="bg-indigo-500 h-2 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 w-9 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;

import React, { useState, useEffect } from 'react';
import type { ActiveTab, Task, TaskCreatePayload, TaskExecutionStatus } from '../../types/task';
import {
  fetchTasks,
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  deleteTask,
} from '../../api/tasks';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { AddTaskModal } from './AddTaskModal';
import { CommandPalette } from './CommandPalette';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { DashboardView } from '../../pages/DashboardView';
import { TodayView } from '../../pages/TodayView';
import { RoutinePlannerView } from '../../pages/RoutinePlannerView';
import { RescheduleView } from '../../pages/RescheduleView';
import { GoalsView } from '../../pages/GoalsView';
import { FocusView } from '../../pages/FocusView';
import { AnalyticsView } from '../../pages/AnalyticsView';
import { AIAssistantView } from '../../pages/AIAssistantView';
import { CalendarView } from '../../pages/CalendarView';
import { HabitsView } from '../../pages/HabitsView';
import { NotesView } from '../../pages/NotesView';
import { ResourcesView } from '../../pages/ResourcesView';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AppLayoutProps {
  onBackToLanding: () => void;
}

const pathToTab = (pathname: string): ActiveTab => {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  switch (clean) {
    case 'routine-planner':
    case 'routine':
    case 'planner':
      return 'routine-planner';
    case 'tasks':
    case 'today':
      return 'tasks';
    case 'reschedule':
      return 'reschedule';
    case 'goals':
      return 'goals';
    case 'focus':
      return 'focus';
    case 'calendar':
      return 'calendar';
    case 'analytics':
      return 'analytics';
    case 'ai-assistant':
    case 'assistant':
    case 'ai':
      return 'ai-assistant';
    case 'habits':
      return 'habits';
    case 'notes':
      return 'notes';
    case 'resources':
      return 'resources';
    case 'settings':
      return 'settings';
    default:
      return 'dashboard';
  }
};

const tabToPath = (tab: ActiveTab): string => {
  if (tab === 'dashboard') return '/';
  return `/${tab}`;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => pathToTab(window.location.pathname));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'ai-assistant') {
      setIsAIAssistantOpen(true);
      return;
    }
    setActiveTab(tab);
    const targetPath = tabToPath(tab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(pathToTab(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateOrUpdate = async (payload: TaskCreatePayload, editingTaskId?: number) => {
    try {
      if (editingTaskId) {
        const updated = await updateTask(editingTaskId, payload);
        setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
        showToast('Task updated successfully');
      } else {
        const created = await createTask(payload);
        setTasks((prev) => [created, ...prev]);
        showToast('New task created');
      }
    } catch (err) {
      showToast('Error saving task', 'info');
    }
    setEditingTask(null);
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.completed) {
        const reopened = await reopenTask(task.id);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? reopened : t)));
        showToast('Task reopened', 'info');
      } else {
        const completed = await completeTask(task.id);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? completed : t)));
        showToast('Task marked complete!', 'success');
      }
    } catch (err) {
      showToast('Error toggling status', 'info');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Task deleted', 'info');
    } catch (err) {
      showToast('Error deleting task', 'info');
    }
  };

  const handleUpdateTaskStatus = async (task: Task, status: TaskExecutionStatus) => {
    try {
      const isCompleted = status === 'COMPLETED';
      const updated = await updateTask(task.id, {
        status,
        completed: isCompleted,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showToast(`Task marked as ${status.replace('_', ' ')}`, 'info');
    } catch (err) {
      showToast('Error updating task execution status', 'info');
    }
  };

  const handleRecordFocus = async (taskId: number, minutes: number) => {
    try {
      const target = tasks.find((t) => t.id === taskId);
      const currentActual = target?.actual_duration_minutes || 0;
      const newActual = currentActual + minutes;
      const updated = await updateTask(taskId, {
        actual_duration_minutes: newActual,
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast(`Logged ${minutes}m focus session (Total: ${newActual}m)`, 'success');
    } catch (err) {
      showToast('Error recording focus minutes', 'info');
    }
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasksCount = tasks.filter((t) => !t.completed && (t.due_date === todayStr || !t.due_date)).length;
  
  // Calculate actionable Smart Reschedule / recovery candidates (overdue, missed, or pending today)
  const overdueTasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr);
  const missedTasks = tasks.filter((t) => !t.completed && t.status === 'MISSED');
  const pendingTodayTasks = tasks.filter((t) => !t.completed && (t.due_date === todayStr || !t.due_date));
  const recoveryTaskIds = new Set<number>();
  [...overdueTasks, ...missedTasks, ...pendingTodayTasks].forEach((t) => recoveryTaskIds.add(t.id));
  const rescheduleTasksCount = recoveryTaskIds.size;

  const renderActiveView = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Syncing with LifeOS Task Engine...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTask}
            onOpenAddTask={handleOpenAddModal}
            onNavigateTab={(tab) => handleSelectTab(tab)}
            showToast={showToast}
          />
        );
      case 'routine-planner':
        return (
          <RoutinePlannerView
            tasks={tasks}
            onTasksUpdated={loadTasks}
            showToast={showToast}
            onNavigateTab={(tab) => handleSelectTab(tab)}
          />
        );
      case 'tasks':
        return (
          <TodayView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTask}
            onOpenAddTask={handleOpenAddModal}
            onOpenReschedule={() => handleSelectTab('reschedule')}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        );
      case 'reschedule':
        return (
          <RescheduleView
            tasks={tasks}
            onTasksUpdated={loadTasks}
            showToast={showToast}
            onBackToDashboard={() => handleSelectTab('dashboard')}
          />
        );
      case 'goals':
        return <GoalsView showToast={showToast} />;
      case 'focus':
        return <FocusView tasks={tasks} showToast={showToast} onRecordFocus={handleRecordFocus} />;
      case 'calendar':
        return <CalendarView tasks={tasks} onSelectTask={handleOpenEditModal} />;
      case 'analytics':
        return <AnalyticsView tasks={tasks} />;
      case 'ai-assistant':
        return <AIAssistantView />;
      case 'habits':
        return <HabitsView showToast={showToast} />;
      case 'notes':
        return <NotesView />;
      case 'resources':
        return <ResourcesView />;
      case 'settings':
        return (
          <div className="bento-card" style={{ maxWidth: '640px' }}>
            <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
              Application Settings
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', marginBottom: '20px' }}>
              Preferences, student profiles, and database synchronization.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Backend Database</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>FastAPI + SQLAlchemy Engine</div>
                </div>
                <span className="recovery-badge">ONLINE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Design Theme</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Modern SaaS Light Theme</div>
                </div>
                <span className="recovery-badge">ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Active Profile</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Rishi Jha (Student / Developer)</div>
                </div>
                <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onBackToLanding}>
                  Landing Page
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell-layout">
      {/* Sidebar for Desktop Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        todayCount={todayTasksCount}
        rescheduleCount={rescheduleTasksCount}
      />

      {/* Main App Content Area */}
      <div className="app-main-viewport">
        <Topbar
          onOpenAddTask={handleOpenAddModal}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
        />

        <main className="app-content-body">{renderActiveView()}</main>

        {/* Mobile Navigation for Small Viewports */}
        <MobileNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          todayCount={todayTasksCount}
        />
      </div>

      {/* Modal Dialog for Add/Edit Task */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdate}
        taskToEdit={editingTask}
      />

      {/* Ctrl + K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
        onOpenAddTask={handleOpenAddModal}
        tasks={tasks}
      />

      {/* Global Floating AI Assistant & Slide-in Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onOpen={() => setIsAIAssistantOpen(true)}
        onClose={() => setIsAIAssistantOpen(false)}
      />

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className={`toast-notification toast-${toastMessage.type}`} role="status">
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};


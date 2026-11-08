import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { VisitModal } from './components/VisitModal';
import { SmartVisitDrawer } from './components/SmartVisitDrawer';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { TimelinePage } from './pages/TimelinePage';
import { TaskLogPage } from './pages/TaskLogPage';
import { CirclePage } from './pages/CirclePage';
import { AiSummaryPage } from './pages/AiSummaryPage';

const ProtectedLayout = ({ children, onOpenNewVisit, onOpenSmartEntry }) => {
  const { user, loading, activeCircle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Loading CareCircle...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onOpenNewVisit={() => onOpenNewVisit()}
        onOpenSmartEntry={onOpenSmartEntry}
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-6">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export function App() {
  const { activeCircle, refreshUserData } = useAuth();
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [initialTimes, setInitialTimes] = useState({ start: null, end: null });
  const [prefilledVisitData, setPrefilledVisitData] = useState(null);
  const [isSmartDrawerOpen, setIsSmartDrawerOpen] = useState(false);

  const handleOpenNewVisit = (times = {}) => {
    setSelectedVisit(null);
    setPrefilledVisitData(null);
    setInitialTimes({
      start: times.startTime || null,
      end: times.endTime || null,
    });
    setIsVisitModalOpen(true);
  };

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
    setPrefilledVisitData(null);
    setIsVisitModalOpen(true);
  };

  const handleVisitParsed = (parsedData) => {
    setSelectedVisit(null);
    setPrefilledVisitData(parsedData);
    setIsVisitModalOpen(true);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            'dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700 text-xs font-semibold rounded-xl shadow-lg',
          duration: 3500,
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <DashboardPage
                onOpenNewVisit={handleOpenNewVisit}
                onSelectVisit={handleSelectVisit}
                onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <CalendarPage
                onOpenNewVisit={handleOpenNewVisit}
                onSelectVisit={handleSelectVisit}
                onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
              />
            </ProtectedLayout>
          }
        />

        <Route
          path="/timeline"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <TimelinePage onSelectVisit={handleSelectVisit} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <TaskLogPage onSelectVisit={handleSelectVisit} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/circle"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <CirclePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/ai-summary"
          element={
            <ProtectedLayout
              onOpenNewVisit={handleOpenNewVisit}
              onOpenSmartEntry={() => setIsSmartDrawerOpen(true)}
            >
              <AiSummaryPage />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Primary Visit Modal */}
      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        circle={activeCircle}
        visit={selectedVisit}
        initialStartTime={initialTimes.start}
        initialEndTime={initialTimes.end}
        prefilledData={prefilledVisitData}
        onSaved={() => {
          refreshUserData();
        }}
      />

      {/* Gemini Natural Language Smart Visit Drawer */}
      <SmartVisitDrawer
        isOpen={isSmartDrawerOpen}
        onClose={() => setIsSmartDrawerOpen(false)}
        circleId={activeCircle?._id}
        onVisitParsed={handleVisitParsed}
      />
    </>
  );
}
export default App;

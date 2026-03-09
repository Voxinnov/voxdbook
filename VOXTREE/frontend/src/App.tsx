import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import Projects from './pages/Projects';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import Documentation from './pages/Documentation';
import DocumentDetail from './pages/DocumentDetail';
import Quotations from './pages/Quotations';
import QuotationSettings from './pages/QuotationSettings';
import QuotationPreview from './pages/QuotationPreview';
import MilestoneManagement from './pages/MilestoneManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import Timesheet from './pages/Timesheet';
import InvoiceHistory from './pages/InvoiceHistory';
import Notifications from './pages/Notifications';
import UsersAdmin from './pages/UsersAdmin';
import DownloadApp from './pages/DownloadApp';

// VOXdBOOK Pages
import SmartDashboard from './pages/VOXdBOOK/Dashboard';
import SmartTransactions from './pages/VOXdBOOK/Transactions';
import SmartTasks from './pages/VOXdBOOK/Tasks';
import SmartTodos from './pages/VOXdBOOK/Todos';
import SmartCategories from './pages/VOXdBOOK/Categories';
import SmartRenewals from './pages/VOXdBOOK/Renewals';
import SmartReminders from './pages/VOXdBOOK/Reminders';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const { initialize, isInitialized } = useAuth();

  useEffect(() => {
    try {
      if (!isInitialized) {
        initialize();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, []); // Run only once on mount

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects/page"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProjectDetail />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/projects/create"
              element={
                <PrivateRoute>
                  <Layout>
                    <CreateProject />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/tasks/create"
              element={
                <PrivateRoute>
                  <Layout>
                    <CreateTask />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/documentation"
              element={
                <PrivateRoute>
                  <Layout>
                    <Documentation />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/documentation/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <DocumentDetail />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/quotations"
              element={
                <PrivateRoute>
                  <Layout>
                    <Quotations />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/quotations/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <QuotationSettings />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/quotations/:id/preview"
              element={
                <PrivateRoute>
                  <Layout>
                    <QuotationPreview />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/milestones"
              element={
                <PrivateRoute>
                  <Layout>
                    <MilestoneManagement />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeManagement />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/time-tracking"
              element={
                <PrivateRoute>
                  <Layout>
                    <Timesheet />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <PrivateRoute>
                  <Layout>
                    <InvoiceHistory />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <PrivateRoute>
                  <Layout>
                    <UsersAdmin />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/transactions"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTransactions />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/tasks"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTasks />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/todos"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartTodos />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/categories"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartCategories />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/renewals"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartRenewals />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/voxdbook/reminders"
              element={
                <PrivateRoute>
                  <Layout>
                    <SmartReminders />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/download"
              element={<DownloadApp />}
            />


            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

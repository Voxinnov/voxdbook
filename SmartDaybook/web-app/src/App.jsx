import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Tasks from './pages/Tasks';
import Todos from './pages/Todos';

import Categories from './pages/Categories';
import DietPlanner from './pages/DietPlanner/index';
import DayPlanner from './pages/DayPlanner/index';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading session...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="todos" element={<Todos />} />
            <Route path="diet-planner" element={<DietPlanner />} />
            <Route path="day-planner" element={<DayPlanner />} />
            <Route path="categories" element={<Categories />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

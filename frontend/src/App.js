import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { useSelector } from 'react-redux';

import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import MeetingScheduler from './pages/ImageBasedMeetingScheduler';
import TeamMembers from './pages/TeamMembers';
import Profile from './pages/Profile';
import ScheduleMeeting from './pages/ScheduleMeeting';
import LandingPage from './pages/LandingPage';

const { Content } = Layout;

function App() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const location = useLocation();

  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  // Determine if navigation should be shown
  const showNavigation = isAuthenticated && 
    !location.pathname.includes('/login') && 
    !location.pathname.includes('/register');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {showNavigation && <Navigation />}
      <Content style={{ padding: showNavigation ? '24px' : '0' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <PrivateRoute>
                <CreateTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <PrivateRoute>
                <TaskDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks/:taskId/edit"
            element={
              <PrivateRoute>
                <EditTask />
              </PrivateRoute>
            }
          />
          <Route
            path="/voice"
            element={
              <PrivateRoute>
                <MeetingScheduler />
              </PrivateRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <PrivateRoute>
                <MeetingScheduler />
              </PrivateRoute>
            }
          />
          <Route
            path="/meetings/schedule"
            element={
              <PrivateRoute>
                <ScheduleMeeting />
              </PrivateRoute>
            }
          />
          <Route
            path="/team"
            element={
              <PrivateRoute>
                <TeamMembers />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;

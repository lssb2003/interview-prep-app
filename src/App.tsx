// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import PrivateRoute from './components/auth/PrivateRoute';
import ProfileCheck from './components/auth/ProfileCheck';
import Dashboard from './components/dashboard/Dashboard';
import ProfileSetup from './components/profile/ProfileSetup';
import Profile from './components/profile/Profile';
import SessionSetup from './components/practice/SessionSetup';
import PracticeSession from './components/practice/PracticeSession';
import AnswerLibrary from './components/answers/AnswerLibrary';
import JobTracker from './components/jobs/JobTracker';
import JobDetail from './components/jobs/JobDetail';
import JobForm from './components/jobs/JobForm';
import Layout from './components/layout/Layout';
import UserTestingForm from './components/testing/UserTestingForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/user-testing" element={<UserTestingForm />} />

          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile/setup" element={<ProfileSetup />} />
            <Route path="profile" element={<ProfileCheck><Profile /></ProfileCheck>} />
            <Route path="practice/setup" element={<ProfileCheck><SessionSetup /></ProfileCheck>} />
            <Route path="practice/session/:sessionId" element={<ProfileCheck><PracticeSession /></ProfileCheck>} />
            <Route path="answers" element={<ProfileCheck><AnswerLibrary /></ProfileCheck>} />
            <Route path="jobs" element={<ProfileCheck><JobTracker /></ProfileCheck>} />
            <Route path="jobs/:jobId" element={<ProfileCheck><JobDetail /></ProfileCheck>} />
            <Route path="jobs/new" element={<ProfileCheck><JobForm /></ProfileCheck>} />
          </Route>

          {/* Redirect all other routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
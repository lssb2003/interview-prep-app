// src/App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the router components with proper TypeScript types
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ path, element }: { path?: string; element: React.ReactNode }) => (
    <div data-testid={`route-${path || 'default'}`}>{element}</div>
  ),
  Navigate: () => <div data-testid="navigate">Navigate</div>,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => jest.fn(),
}));

// Mock toast component
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock auth provider with proper type
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    currentUser: null,
    loading: false
  })
}));

// Mock route components with visible content
jest.mock('./components/auth/Login', () => () => <div data-testid="login-component">Login</div>);
jest.mock('./components/auth/Register', () => () => <div data-testid="register-component">Register</div>);
jest.mock('./components/auth/ForgotPassword', () => () => <div data-testid="forgot-password-component">ForgotPassword</div>);
jest.mock('./components/auth/PrivateRoute', () =>
  ({ children }: { children: React.ReactNode }) => <div data-testid="private-route">{children}</div>
);
jest.mock('./components/layout/Layout', () =>
  () => <div data-testid="layout-component">Layout</div>
);
jest.mock('./components/auth/ProfileCheck', () =>
  ({ children }: { children: React.ReactNode }) => <div data-testid="profile-check">{children}</div>
);
jest.mock('./components/dashboard/Dashboard', () =>
  () => <div data-testid="dashboard">Dashboard</div>
);

test('renders app without crashing', () => {
  render(<App />);

  // Test for specific components instead of body text
  expect(screen.getByTestId('browser-router')).toBeInTheDocument();
  expect(screen.getByTestId('routes')).toBeInTheDocument();
  expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  expect(screen.getByTestId('toaster')).toBeInTheDocument();
});
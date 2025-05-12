// src/components/auth/__tests__/LoginBasic.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from '../Login';

// Mock everything that would cause problems
jest.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => jest.fn()
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    loading: false
  })
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

test('Login renders a sign in button', () => {
  render(<Login />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
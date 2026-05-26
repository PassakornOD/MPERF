import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import LoginPage from '../page';
import { signIn } from 'next-auth/react';
import { ToastProvider } from '../../../components/common/Toast';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('Login Page', () => {
  test('renders login form', () => {
    render(
      <ToastProvider>
        <LoginPage />
      </ToastProvider>
    );
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  test('calls signIn on submit', async () => {
    const signInMock = signIn as any;
    signInMock.mockResolvedValue({ ok: true });
    
    render(
      <ToastProvider>
        <LoginPage />
      </ToastProvider>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      username: 'admin',
      password: 'password',
    }));
  });
});

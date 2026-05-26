import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import DashboardWrapper from '../DashboardWrapper';
import { usePathname } from 'next/navigation';
import { useModal } from '@/components/context/ModalContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock ModalContext
vi.mock('@/components/context/ModalContext', () => ({
  useModal: vi.fn(),
}));

// Mock child components to keep test isolated
vi.mock('../Navbar', () => ({ default: () => <div data-testid="navbar">Navbar</div> }));
vi.mock('../Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));

describe('DashboardWrapper', () => {
  test('renders children and navigation for normal pages', () => {
    (usePathname as any).mockReturnValue('/');
    (useModal as any).mockReturnValue({ isModalOpen: false });
    
    render(<DashboardWrapper><div>Page Content</div></DashboardWrapper>);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  test('hides navigation on login page', () => {
    (usePathname as any).mockReturnValue('/login');
    (useModal as any).mockReturnValue({ isModalOpen: false });
    
    render(<DashboardWrapper><div>Login Page</div></DashboardWrapper>);
    
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('hides navigation when a modal is open', () => {
    (usePathname as any).mockReturnValue('/');
    (useModal as any).mockReturnValue({ isModalOpen: true });
    
    render(<DashboardWrapper><div>Page Content</div></DashboardWrapper>);
    
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });
});

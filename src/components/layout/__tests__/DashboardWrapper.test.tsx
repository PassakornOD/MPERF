import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import DashboardWrapper from '../DashboardWrapper';
import { usePathname } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock child components to keep test isolated
vi.mock('../Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('../Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));

describe('DashboardWrapper', () => {
  test('renders children and navigation for normal pages', () => {
    (usePathname as any).mockReturnValue('/');
    
    render(<DashboardWrapper><div>Page Content</div></DashboardWrapper>);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  test('hides navigation on login page', () => {
    (usePathname as any).mockReturnValue('/login');
    
    render(<DashboardWrapper><div>Login Page</div></DashboardWrapper>);
    
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('keeps navigation regardless of external state', () => {
    (usePathname as any).mockReturnValue('/');
    
    render(<DashboardWrapper><div>Page Content</div></DashboardWrapper>);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

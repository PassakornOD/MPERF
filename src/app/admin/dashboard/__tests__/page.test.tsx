import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import UnifiedAdminDashboard from '../page';

// Mock child pages
vi.mock('@/app/admin/users/page', () => ({ default: () => <div data-testid="users-page">Users Page</div> }));
vi.mock('@/app/admin/user-groups/page', () => ({ default: () => <div data-testid="groups-page">Groups Page</div> }));
vi.mock('@/app/admin/permission-groups/page', () => ({ default: () => <div data-testid="permissions-page">Permissions Page</div> }));

describe('UnifiedAdminDashboard', () => {
  test('renders initial users tab', () => {
    render(<UnifiedAdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('users-page')).toBeInTheDocument();
    expect(screen.queryByTestId('groups-page')).not.toBeInTheDocument();
  });

  test('switches tabs on click', () => {
    render(<UnifiedAdminDashboard />);
    
    // Switch to User Groups
    const groupsTab = screen.getByRole('button', { name: /User Groups/i });
    fireEvent.click(groupsTab);
    expect(screen.getByTestId('groups-page')).toBeInTheDocument();
    expect(screen.queryByTestId('users-page')).not.toBeInTheDocument();
    
    // Switch to Permission Groups
    const permissionsTab = screen.getByRole('button', { name: /Permission Groups/i });
    fireEvent.click(permissionsTab);
    expect(screen.getByTestId('permissions-page')).toBeInTheDocument();
    expect(screen.queryByTestId('groups-page')).not.toBeInTheDocument();
  });
});

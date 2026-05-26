import { screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import ManageGroupsPage from '../page';
import { useSession } from 'next-auth/react';
import { renderWithProviders } from '../../../../../test-utils';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
global.fetch = vi.fn();

describe('Manage Groups & Assets Page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders manage interface for admin', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ hostgroup_id: 1, hostgroup: 'HG-1', hostnames: [] }],
    });

    renderWithProviders(<ManageGroupsPage />);
    
    expect(screen.getByText(/Manage Assets/i)).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.getByText(/Create Hostgroup/i)).toBeInTheDocument();
    });
  });

  test('displays access denied for non-admin/sysadmin', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'viewer' } }, status: 'authenticated' });
    renderWithProviders(<ManageGroupsPage />);
    expect(screen.queryByText(/Create Hostgroup/i)).not.toBeInTheDocument();
  });
});

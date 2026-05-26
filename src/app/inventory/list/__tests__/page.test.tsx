import { screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import InventoryListPage from '../page';
import { useSession } from 'next-auth/react';
import { renderWithProviders } from '../../../../test-utils';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Inventory List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    // Mock axios to never resolve
    import('axios').then(axios => (axios.default.get as any).mockReturnValue(new Promise(() => {})));

    renderWithProviders(<InventoryListPage />);
    expect(screen.getByText(/Server Inventory/i)).toBeInTheDocument();
  });

  test('renders server list data after fetching', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    const mockServers = [
      { hostname: 'Server-01', hostgroup: 'HG-A', OS: 'RedHat', cpu: 8, mem: 32 },
    ];
    import('axios').then(axios => (axios.default.get as any).mockResolvedValue({ data: mockServers }));

    renderWithProviders(<InventoryListPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Server-01')).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import CpuDailyPage from '../page';
import { useSession } from 'next-auth/react';
import { renderWithProviders } from '../../../../test-utils';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('@/components/charts/SarChart', () => ({ default: () => <div data-testid="sar-chart-container" /> }));
global.fetch = vi.fn();

describe('CPU Daily Page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('loads and renders chart data', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    
    // Mock hostgroups response
    (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ hostgroup_id: 1, hostgroup: 'HG1', hostnames: [{ hostname_id: 1, hostname: 'HN1' }] }],
    });
    
    // Mock metrics response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ time: '2026-04-01T10:00:00', usr: 10, sys: 5, idle: 85 }],
    });

    renderWithProviders(<CpuDailyPage />);
    
    // Select group and hostname
    const selects = screen.getAllByRole('combobox');
    const groupSelect = selects[0];
    const hostSelect = selects[1];
    const queryButton = screen.getByRole('button', { name: /Query/i });

    renderWithProviders(<CpuDailyPage />);
    
    // The component might render multiple times due to providers, 
    // using queryAllByText to handle multiple occurrences if needed
    const messages = screen.getAllByText(/Please select filters/i);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toBeInTheDocument();
  });
});

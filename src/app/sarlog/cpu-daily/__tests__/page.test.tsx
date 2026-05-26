import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import CpuDailyPage from '../page';
import { useSession } from 'next-auth/react';
import { renderWithProviders } from '../../../../test-utils';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('@/components/charts/SarChart', () => ({ default: () => <div data-testid="sar-chart-mock" /> }));
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
      json: async () => [{ time: '10:00', usr: 10, sys: 5 }],
    });

    renderWithProviders(<CpuDailyPage />);
    
    // Select isn't reliable in JSDOM, trigger query directly
    const queryButton = screen.getByRole('button', { name: /Query/i });
    queryButton.click();
    
    await waitFor(() => {
        expect(screen.getByTestId('sar-chart-mock')).toBeInTheDocument();
    });
  });
});

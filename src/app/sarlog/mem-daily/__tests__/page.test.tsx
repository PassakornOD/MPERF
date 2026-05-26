import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import MemDailyPage from '../page';
import { useSession } from 'next-auth/react';
import { renderWithProviders } from '../../../../test-utils';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('@/components/charts/SarChart', () => ({ default: () => <div data-testid="sar-chart-mock" /> }));
global.fetch = vi.fn();

describe('Memory Daily Page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('loads and renders chart', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    
    (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ hostgroup_id: 1, hostgroup: 'HG1', hostnames: [{ hostname_id: 1, hostname: 'HN1' }] }],
    });
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ time: '10:00', kbmemused: 100000 }],
    });

    renderWithProviders(<MemDailyPage />);
    
    const queryButton = screen.getByRole('button', { name: /Query/i });
    queryButton.click();
    
    await waitFor(() => {
        expect(screen.getByTestId('sar-chart-mock')).toBeInTheDocument();
    });
  });
});

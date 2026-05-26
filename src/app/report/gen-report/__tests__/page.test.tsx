import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import GenReportPage from '../page';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
global.fetch = vi.fn();

describe('Generate Report Page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders form elements for report generation', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ hostgroup_id: 1, hostgroup: 'HG-1' }],
    });

    render(<GenReportPage />);
    
    expect(screen.getByText(/Generate Report/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate PDF/i })).toBeInTheDocument();
    });
  });
});

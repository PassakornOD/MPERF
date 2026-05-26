import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import ReportTemplatesPage from '../page';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
global.fetch = vi.fn();

describe('Report Templates Page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders templates list', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Monthly Summary' }],
    });

    render(<ReportTemplatesPage />);
    
    expect(screen.getByText(/Report Templates/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Monthly Summary')).toBeInTheDocument();
    });
  });
});

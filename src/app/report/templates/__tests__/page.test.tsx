import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import ReportTemplatesPage from '../page';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/common/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));
vi.mock('@/components/common/Toast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));
vi.mock('axios');

describe('Report Templates Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockReturnValue({ data: [], isLoading: false });
    (useMutation as any).mockReturnValue({ mutate: vi.fn() });
  });

  test('renders templates list', async () => {
    (useSession as any).mockReturnValue({ data: { user: { role: 'admin', id: '1' } }, status: 'authenticated' });
    (useQuery as any).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'report_templates') {
        return { 
          data: [{ id: 1, name: 'Monthly Summary', reportTitle: 'Title', hosts: [], charts: [], lastUpdated: '2026-05-29' }], 
          isLoading: false 
        };
      }
      return { data: [], isLoading: false };
    });

    render(<ReportTemplatesPage />);
    
    expect(screen.getByText(/Report Templates/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Monthly Summary')).toBeInTheDocument();
    });
  });
});

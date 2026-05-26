import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import IngestPage from '../page';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock components
vi.mock('@/components/layout/DashboardWrapper', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/common/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('IngestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as any).mockResolvedValue({ data: [] });
  });

  test('renders ingestion mode options', () => {
    render(<IngestPage />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Specific Date')).toBeInTheDocument();
    expect(screen.getByText('Full Month')).toBeInTheDocument();
  });

  test('toggles ingestion mode', async () => {
    render(<IngestPage />);
    const specificDateBtn = screen.getByText('Specific Date');
    fireEvent.click(specificDateBtn);
    
    // Should show Day/Month inputs for specific date mode
    expect(screen.getByPlaceholderText('Day')).toBeInTheDocument();
  });

  test('starts ingestion task on click', async () => {
    (axios.post as any).mockResolvedValue({ data: { results: ['[Success] Test Log'] } });
    render(<IngestPage />);
    
    // Wait for button to be enabled (after fetchMetadata)
    const startBtn = await screen.findByRole('button', { name: /Start Ingestion/i });
    expect(startBtn).not.toBeDisabled();
    
    fireEvent.click(startBtn);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/admin/ingest', expect.anything());
      expect(screen.getByText(/Test Log/i)).toBeInTheDocument();
    });
  });
});

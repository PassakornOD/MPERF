import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import ExplorerGuidePage from '../page';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Database: () => <div data-testid="database-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Terminal: () => <div data-testid="terminal-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Check: () => <div data-testid="check-icon" />,
}));

describe('Explorer DB Guide Page', () => {
  test('renders main headings', () => {
    render(<ExplorerGuidePage />);
    expect(screen.getByText(/Explorer DB Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Querying Data/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Maintenance/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/API Integration/i)).toBeInTheDocument();
  });

  test('contains maintenance warnings', () => {
    render(<ExplorerGuidePage />);
    expect(screen.getByText(/All deletion operations are permanent/i)).toBeInTheDocument();
  });
});

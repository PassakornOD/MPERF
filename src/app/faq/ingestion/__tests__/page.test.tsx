import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import IngestionDBGuidePage from '../page';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Copy: () => <div data-testid="copy-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Terminal: () => <div data-testid="terminal-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Search: () => <div data-testid="search-icon" />,
}));

describe('Ingestion DB Guide Page', () => {
  test('renders main headings', () => {
    render(<IngestionDBGuidePage />);
    expect(screen.getByText(/Ingestion Database Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/System Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Operation Modes/i)).toBeInTheDocument();
    expect(screen.getByText(/Usage Interfaces/i)).toBeInTheDocument();
  });

  test('contains parameter reference table', () => {
    render(<IngestionDBGuidePage />);
    expect(screen.getByText(/Parameter Reference/i)).toBeInTheDocument();
    expect(screen.getAllByText(/dataType/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/hostgroup/i).length).toBeGreaterThanOrEqual(1);
  });
});

import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import OperationsPage from '../page';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Server: () => <div data-testid="server-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  BarChart3: () => <div data-testid="barchart-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('Operations Guide Page', () => {
  test('renders main headings', () => {
    render(<OperationsPage />);
    expect(screen.getByText(/Operations Guide/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Manage Assets/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Performance Analysis/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Generate Report/i).length).toBeGreaterThanOrEqual(1);
  });

  test('contains navigation hints', () => {
    render(<OperationsPage />);
    expect(screen.getAllByText(/Inventory/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Report/i).length).toBeGreaterThanOrEqual(1);
  });
});

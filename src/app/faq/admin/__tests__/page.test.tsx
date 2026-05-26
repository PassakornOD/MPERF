import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import AdminGuidePage from '../page';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ShieldCheck: () => <div data-testid="shield-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  Server: () => <div data-testid="server-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

describe('Admin Guide Page', () => {
  test('renders main headings', () => {
    render(<AdminGuidePage />);
    expect(screen.getByText(/Admin Dashboard Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Modules/i)).toBeInTheDocument();
    expect(screen.getByText(/Access Mapping Workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Security & Best Practices/i)).toBeInTheDocument();
  });

  test('describes the access chain', () => {
    render(<AdminGuidePage />);
    // Use getAllByText for terms that appear multiple times
    expect(screen.getAllByText(/Hostgroups/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/PG/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/User Group/i).length).toBeGreaterThanOrEqual(1);
  });
});

import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import FaqPage from '../page';

// Mock lucide-react icons if necessary, but Vitest + RTL should handle them
// Mocking if there are environment issues with icons in tests
vi.mock('lucide-react', () => ({
  Copy: () => <div data-testid="copy-icon" />,
  Check: () => <div data-testid="check-icon" />,
  Terminal: () => <div data-testid="terminal-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Container: () => <div data-testid="container-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
}));

test('FAQ Page renders main heading and section titles', () => {
  render(<FaqPage />);
  
  // Verify main heading
  expect(screen.getByText(/Docker Runtime Guide/i)).toBeInTheDocument();
  
  // Verify section titles
  expect(screen.getByText(/Operational Prerequisites/i)).toBeInTheDocument();
  expect(screen.getByText(/Emission & Orchestration/i)).toBeInTheDocument();
  expect(screen.getByText(/Variable Configuration/i)).toBeInTheDocument();
  expect(screen.getByText(/SSL\/TLS Encryption/i)).toBeInTheDocument();
  expect(screen.getByText(/Credential Hardening/i)).toBeInTheDocument();
});

test('FAQ Page contains docker and security commands', () => {
  render(<FaqPage />);
  
  expect(screen.getByText(/docker build -t mperf-app/i)).toBeInTheDocument();
  expect(screen.getByText(/docker-compose up -d/i)).toBeInTheDocument();
  expect(screen.getByText(/openssl req -x509/i)).toBeInTheDocument();
  expect(screen.getAllByText(/base64:/i).length).toBeGreaterThan(0);
});

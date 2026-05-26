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
}));

test('FAQ Page renders main heading and section titles', () => {
  render(<FaqPage />);
  
  // Verify main heading
  expect(screen.getByText(/Docker Build Guide/i)).toBeInTheDocument();
  
  // Verify section titles
  expect(screen.getByText(/Prerequisites/i)).toBeInTheDocument();
  expect(screen.getByText(/Build & Run/i)).toBeInTheDocument();
  expect(screen.getByText(/Environment Setup/i)).toBeInTheDocument();
});

test('FAQ Page contains docker commands', () => {
  render(<FaqPage />);
  
  expect(screen.getByText(/docker build -t mperf-web/i)).toBeInTheDocument();
  expect(screen.getByText(/docker-compose up -d/i)).toBeInTheDocument();
});

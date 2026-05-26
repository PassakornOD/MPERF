import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import FolderTabs from '../FolderTabs';
import { useRouter, usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn()
}));

describe('FolderTabs Component', () => {
  const tabs = [
    { name: 'Tab1', href: '/tab1', iconKey: 'Cpu' },
    { name: 'Tab2', href: '/tab2', iconKey: 'MemoryStick' }
  ];

  test('renders tabs and content', () => {
    (usePathname as any).mockReturnValue('/tab1');
    (useRouter as any).mockReturnValue({ push: vi.fn() });

    render(
      <FolderTabs tabs={tabs}>
        <div data-testid="child-content">Content</div>
      </FolderTabs>
    );

    expect(screen.getByText('Tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab2')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('calls router.push when tab is clicked', () => {
    const pushMock = vi.fn();
    (usePathname as any).mockReturnValue('/tab1');
    (useRouter as any).mockReturnValue({ push: pushMock });

    render(<FolderTabs tabs={tabs}>Content</FolderTabs>);

    fireEvent.click(screen.getByText('Tab2'));
    expect(pushMock).toHaveBeenCalledWith('/tab2');
  });

  test('content area has animation class', () => {
    (usePathname as any).mockReturnValue('/tab1');
    (useRouter as any).mockReturnValue({ push: vi.fn() });

    render(<FolderTabs tabs={tabs}><div>Content</div></FolderTabs>);
    
    // Select based on parent or specific structure
    const contentArea = screen.getByText('Content').closest('.animate-ease-in');
    expect(contentArea).not.toBeNull();
    expect(contentArea?.className).toContain('animate-ease-in');
  });
});

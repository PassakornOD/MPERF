import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { ToastProvider, useToast } from '../Toast';
import React from 'react';

const TestComponent = () => {
  const { showToast } = useToast();
  return <button onClick={() => showToast('Test Message', 'info')}>Show Toast</button>;
};

describe('Toast Component', () => {
  test('renders toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    fireEvent.click(button);

    expect(await screen.findByText('Test Message')).toBeInTheDocument();
  });
});

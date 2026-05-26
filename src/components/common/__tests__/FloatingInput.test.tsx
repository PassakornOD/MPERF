import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import FloatingInput from '../FloatingInput';
import React from 'react';

describe('FloatingInput Component', () => {
  test('renders with label and value', () => {
    render(<FloatingInput label="Username" value="admin" onChange={() => {}} placeholder="Username" />);
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
  });

  test('calls onChange when typed in', () => {
    const onChange = vi.fn();
    render(<FloatingInput label="Username" value="" onChange={onChange} placeholder="Username" />);
    const input = screen.getByPlaceholderText(/Username/i);
    fireEvent.change(input, { target: { value: 'newuser' } });
    expect(onChange).toHaveBeenCalled();
  });
});

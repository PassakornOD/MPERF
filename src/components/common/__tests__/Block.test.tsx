import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import Block from '../Block';
import React from 'react';

describe('Block Component', () => {
  test('renders children correctly', () => {
    render(<Block title="Test Title">Test Content</Block>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies title if provided', () => {
    render(<Block title="Test Title">Content</Block>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});

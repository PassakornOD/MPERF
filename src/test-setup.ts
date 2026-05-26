import { vi } from 'vitest';
import React from 'react';

vi.mock('highcharts', () => ({
  default: {
    chart: vi.fn(),
    stockChart: vi.fn(),
    setOptions: vi.fn(),
    AST: {
        filterUserAttributes: vi.fn()
    }
  },
}));

vi.mock('highcharts-react-official', () => ({
  default: () => React.createElement('div', { 'data-testid': 'highcharts-mock' }),
}));

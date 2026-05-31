import { expect, test, describe, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn(),
        evaluate: vi.fn().mockResolvedValue({ map: {}, totalPhysicalPages: 1 }),
        pdf: vi.fn().mockResolvedValue(Buffer.from('dummy-pdf')),
        close: vi.fn(),
        setDefaultNavigationTimeout: vi.fn(),
        setViewport: vi.fn()
      }),
      close: vi.fn()
    })
  }
}));

describe('Export PDF API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 500 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/export-pdf', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  test('successfully generates PDF', async () => {
    const payload = {
      reportMonth: '2026-05',
      generatedDate: '2026-05-26',
      hostgroups: [{
        name: 'HG1',
        hosts: [{
            name: 'HN1',
            charts: [{ label: 'CPU Daily', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' }]
        }]
      }]
    };

    const req = new NextRequest('http://localhost/api/export-pdf', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });
});

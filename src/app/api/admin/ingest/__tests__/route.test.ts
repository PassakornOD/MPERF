import { expect, test, describe, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { SarIngestionService } from '@/lib/services/SarIngestionService';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Service
vi.mock('@/lib/services/SarIngestionService', () => ({
  SarIngestionService: {
    ingest: vi.fn(),
  },
}));

// Mock authOptions
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Admin Ingest API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns 401 if user is not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/ingest', { method: 'POST' });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  test('returns 401 if user is not admin', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'viewer' } });
    const req = new Request('http://localhost/api/admin/ingest', { method: 'POST' });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  test('calls ingest service and returns success if user is admin', async () => {
    (getServerSession as any).mockResolvedValue({ user: { role: 'admin', email: 'admin@test.com' } });
    (SarIngestionService.ingest as any).mockResolvedValue(['[Success] Log 1']);
    
    const body = { mode: 'yesterday', dataType: 'All' };
    const req = new Request('http://localhost/api/admin/ingest', { 
        method: 'POST',
        body: JSON.stringify(body)
    });
    
    const res = await POST(req as any);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(SarIngestionService.ingest).toHaveBeenCalled();
  });
});

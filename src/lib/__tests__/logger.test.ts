import { expect, test, describe, vi } from 'vitest';
import { logSecurityEvent } from '../logger';
import fs from 'fs';

vi.mock('fs', () => ({
    default: {
        appendFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn()
    }
}));

describe('Security Logger', () => {
    test('appends security event to log file', () => {
        logSecurityEvent('TEST_ACTION', { user: 'admin', details: 'User performed test' });
        expect(fs.appendFileSync).toHaveBeenCalled();
        const callArgs = (fs.appendFileSync as any).mock.calls[0];
        expect(callArgs[1]).toContain('TEST_ACTION');
        expect(callArgs[1]).toContain('admin');
    });
});

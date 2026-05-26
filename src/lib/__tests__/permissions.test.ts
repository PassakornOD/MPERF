import { expect, test, describe } from 'vitest';
import { checkPermission, Action, Role } from '../permissions';

describe('Permissions Logic', () => {
  test('Admin should have all permissions', () => {
    const actions: Action[] = ['create', 'read', 'update', 'delete'];
    actions.forEach(action => {
      expect(checkPermission('admin', action)).toBe(true);
    });
  });

  test('Sysadmin should have read, create, and update permissions', () => {
    expect(checkPermission('sysadmin', 'read')).toBe(true);
    expect(checkPermission('sysadmin', 'create')).toBe(true);
    expect(checkPermission('sysadmin', 'update')).toBe(true);
    expect(checkPermission('sysadmin', 'delete')).toBe(false);
  });

  test('Operation should only have read permission', () => {
    expect(checkPermission('operation', 'read')).toBe(true);
    expect(checkPermission('operation', 'create')).toBe(false);
    expect(checkPermission('operation', 'update')).toBe(false);
    expect(checkPermission('operation', 'delete')).toBe(false);
  });

  test('Unknown role should have no permissions', () => {
    expect(checkPermission('guest' as any, 'read')).toBe(false);
  });
});

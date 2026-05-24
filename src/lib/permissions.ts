export type Action = 'create' | 'update' | 'delete' | 'read';
export type Role = 'admin' | 'sysadmin' | 'operation';

export const checkPermission = (role: Role, action: Action) => {
  if (role === 'admin') return true;
  if (role === 'sysadmin') return ['read', 'create', 'update'].includes(action);
  if (role === 'operation') return action === 'read';
  return false;
};

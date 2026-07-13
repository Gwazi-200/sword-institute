const ROLE_PERMISSIONS = {
  student: ['read:own', 'write:own'],
  instructor: ['read:own', 'write:own', 'write:course'],
  admin: ['read:all', 'write:all'],
  'super-admin': ['read:all', 'write:all', 'manage:roles'],
};

function hasPermission(role = 'student', permission) {
  const normalizedRole = String(role).toLowerCase();
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.student;
  return permissions.includes(permission);
}

export { ROLE_PERMISSIONS, hasPermission };
export default { ROLE_PERMISSIONS, hasPermission };
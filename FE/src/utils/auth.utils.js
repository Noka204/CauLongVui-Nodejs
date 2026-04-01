export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const buildUserWithRoleFromToken = (user, accessToken) => {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return user;

  return {
    ...user,
    roleName: user?.roleName || payload.roleName,
    roleId: user?.roleId || payload.roleId,
  };
};


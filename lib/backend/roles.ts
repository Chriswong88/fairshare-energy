export type UserRole = 'renter' | 'seller';

export const ROLE_ROUTES: Record<UserRole, string> = {
  renter: '/renter',
  seller: '/seller',
};

export function isUserRole(value: string): value is UserRole {
  return value === 'renter' || value === 'seller';
}

export function getRoleRoute(role: UserRole) {
  return ROLE_ROUTES[role];
}

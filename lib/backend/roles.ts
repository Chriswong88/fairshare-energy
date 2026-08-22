export type UserRole = 'buyer' | 'seller';

export const ROLE_ROUTES: Record<UserRole, string> = {
  buyer: '/renter',
  seller: '/seller',
};

export function isUserRole(value: string): value is UserRole {
  return value === 'buyer' || value === 'seller';
}

export function getRoleRoute(role: UserRole) {
  return ROLE_ROUTES[role];
}

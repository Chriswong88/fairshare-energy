import {isUserRole, type UserRole} from './roles';

export type SignupPayload = {
  email: string;
  password: string;
  fullName: string;
  addressLine: string;
  suburb: string;
  postcode: string;
  activeRole: UserRole;
};

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

export function parseSignupPayload(body: unknown): SignupPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Signup body is required.');
  }

  const data = body as Record<string, unknown>;
  const activeRoleValue = requireText(data.activeRole ?? data.role ?? 'buyer', 'activeRole');

  if (!isUserRole(activeRoleValue)) {
    throw new Error('activeRole must be buyer or seller.');
  }

  return {
    email: requireText(data.email, 'email').toLowerCase(),
    password: requireText(data.password, 'password'),
    fullName: requireText(data.fullName ?? data.name, 'fullName'),
    addressLine: requireText(data.addressLine ?? data.address, 'addressLine'),
    suburb: requireText(data.suburb, 'suburb'),
    postcode: requireText(data.postcode, 'postcode'),
    activeRole: activeRoleValue,
  };
}

export type LoginPayload = {
  email: string;
  password: string;
};

export function parseLoginPayload(body: unknown): LoginPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Login body is required.');
  }

  const data = body as Record<string, unknown>;

  return {
    email: requireText(data.email, 'email').toLowerCase(),
    password: requireText(data.password, 'password'),
  };
}

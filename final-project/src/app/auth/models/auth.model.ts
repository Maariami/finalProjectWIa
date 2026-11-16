export type UserRole = 'Customer' | 'Admin';

export type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailConfirmed: boolean;
  createdAt: string;
};

export type MockEmailDto = {
  to: string;
  subject: string;
  body: string;
  link: string | null;
  token: string | null;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserDto;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  message: string;
  mockEmail?: MockEmailDto | null;
};

export type MessageResponse = {
  message: string;
  mockEmail?: MockEmailDto | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ConfirmEmailRequest = {
  email: string;
  token: string;
};

export type EmailRequest = {
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
};

export type ApiProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

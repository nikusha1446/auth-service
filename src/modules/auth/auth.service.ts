import { hash, verify } from 'argon2';
import { db } from '../../config/database.js';
import { LoginInput, RegisterInput, ResetPasswordInput } from './auth.types.js';
import { generateToken } from '../../common/utils/crypto.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../common/services/email.service.js';
import { generateAccessToken } from '../../common/utils/jwt.js';
import { env } from '../../config/env.js';

export const register = async (
  input: RegisterInput
): Promise<{ userId: string }> => {
  const existingUser = await db.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hash(input.password);
  const emailVerifyToken = generateToken();

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash,
      emailVerifyToken,
    },
  });

  await sendVerificationEmail(user.email, emailVerifyToken);

  return { userId: user.id };
};

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await db.user.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    throw new Error('Invalid verification token');
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });
};

export const login = async (
  input: LoginInput
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const validPassword = await verify(user.passwordHash, input.password);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new Error('Please verify your email before logging in');
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + parseInt(env.REFRESH_TOKEN_EXPIRES_IN_DAYS)
  );

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

export const refresh = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const existingToken = await db.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!existingToken) {
    throw new Error('Invalid refresh token');
  }

  if (existingToken.expiresAt < new Date()) {
    await db.refreshToken.delete({ where: { id: existingToken.id } });
    throw new Error('Refresh token expired');
  }

  await db.refreshToken.delete({ where: { id: existingToken.id } });

  const accessToken = generateAccessToken({
    userId: existingToken.user.id,
    email: existingToken.user.email,
  });

  const newRefreshToken = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + parseInt(env.REFRESH_TOKEN_EXPIRES_IN_DAYS)
  );

  await db.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: existingToken.user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token: string): Promise<void> => {
  const existingToken = await db.refreshToken.findUnique({
    where: {
      token,
    },
  });

  if (!existingToken) {
    throw new Error('Invalid refresh token');
  }

  await db.refreshToken.delete({ where: { id: existingToken.id } });
};

export const logoutAll = async (userId: string): Promise<void> => {
  await db.refreshToken.deleteMany({
    where: { userId },
  });
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return;
  }

  const passwordResetToken = generateToken();
  const passwordResetExpires = new Date();
  passwordResetExpires.setHours(passwordResetExpires.getHours() + 1);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  await sendPasswordResetEmail(email, passwordResetToken);
};

export const resetPassword = async (
  input: ResetPasswordInput
): Promise<void> => {
  const user = await db.user.findFirst({
    where: { passwordResetToken: input.token },
  });

  if (!user) {
    throw new Error('Invalid reset token');
  }

  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new Error('Reset token expired');
  }

  const passwordHash = await hash(input.password);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  await db.refreshToken.deleteMany({
    where: {
      userId: user.id,
    },
  });
};

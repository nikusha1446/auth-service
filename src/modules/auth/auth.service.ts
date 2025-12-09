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
import { createAuditLog } from '../../common/services/audit.service.js';
import {
  getGoogleAuthUrl,
  getGoogleUserInfo,
} from '../../common/services/oauth.service.js';

export interface RequestInfo {
  ipAddress: string;
  userAgent: string;
}

export const register = async (
  input: RegisterInput,
  requestInfo: RequestInfo
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

  await createAuditLog({
    userId: user.id,
    action: 'REGISTER',
    ...requestInfo,
  });

  return { userId: user.id };
};

export const verifyEmail = async (
  token: string,
  requestInfo: RequestInfo
): Promise<void> => {
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

  await createAuditLog({
    userId: user.id,
    action: 'EMAIL_VERIFIED',
    ...requestInfo,
  });
};

export const login = async (
  input: LoginInput,
  requestInfo: RequestInfo
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

  await createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    ...requestInfo,
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

export const logout = async (
  token: string,
  requestInfo: RequestInfo
): Promise<void> => {
  const existingToken = await db.refreshToken.findUnique({
    where: {
      token,
    },
  });

  if (!existingToken) {
    throw new Error('Invalid refresh token');
  }

  await db.refreshToken.delete({ where: { id: existingToken.id } });

  await createAuditLog({
    userId: existingToken.userId,
    action: 'LOGOUT',
    ...requestInfo,
  });
};

export const logoutAll = async (
  userId: string,
  requestInfo: RequestInfo
): Promise<void> => {
  await db.refreshToken.deleteMany({
    where: { userId },
  });

  await createAuditLog({
    userId,
    action: 'LOGOUT_ALL',
    ...requestInfo,
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
  input: ResetPasswordInput,
  requestInfo: RequestInfo
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

  await createAuditLog({
    userId: user.id,
    action: 'PASSWORD_RESET',
    ...requestInfo,
  });
};

export const getGoogleOAuthUrl = (): string => {
  return getGoogleAuthUrl();
};

export const googleLogin = async (
  code: string,
  requestInfo: RequestInfo
): Promise<{ accessToken: string; refreshToken: string }> => {
  const userInfo = await getGoogleUserInfo(code);

  const oauthAccount = await db.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: userInfo.providerAccountId,
      },
    },
    include: { user: true },
  });

  let user;

  if (oauthAccount) {
    user = oauthAccount.user;
  } else {
    user = await db.user.findUnique({
      where: { email: userInfo.email },
    });

    if (user) {
      await db.oAuthAccount.create({
        data: {
          provider: 'google',
          providerAccountId: userInfo.providerAccountId,
          userId: user.id,
        },
      });
    } else {
      user = await db.user.create({
        data: {
          email: userInfo.email,
          emailVerified: true,
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId: userInfo.providerAccountId,
            },
          },
        },
      });

      await createAuditLog({
        userId: user.id,
        action: 'REGISTER',
        ...requestInfo,
      });
    }
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

  await createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    ...requestInfo,
  });

  return { accessToken, refreshToken };
};

import { RequestHandler } from 'express';
import * as authService from './auth.service.js';
import {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.types.js';
import { db } from '../../config/database.js';
import { getClientIp, getUserAgent } from '../../common/utils/request.js';
import { getAuditLogs } from '../../common/services/audit.service.js';

const getRequestInfo = (req: Parameters<RequestHandler>[0]) => ({
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
});

export const register: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as RegisterInput;
    const result = await authService.register(input, getRequestInfo(req));

    res.status(201).json({
      success: true,
      data: {
        userId: result.userId,
        message:
          'Registration successful. Please check your email to verify your account.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as VerifyEmailInput;
    await authService.verifyEmail(token, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        message: 'Email verified successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as LoginInput;
    const result = await authService.login(input, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.refresh(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body as LogoutInput;
    await authService.logout(refreshToken, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    await authService.logoutAll(userId, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        message: 'Logged out from all devices successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body as ForgotPasswordInput;
    await authService.forgotPassword(email);

    res.json({
      success: true,
      data: {
        message: 'If an account exists, a password reset email has been sent',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as ResetPasswordInput;
    await authService.resetPassword(input, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id: req.user!.userId,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const auditLogs: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const logs = await getAuditLogs(userId);

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth: RequestHandler = async (req, res, next) => {
  try {
    const url = authService.getGoogleOAuthUrl();
    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

export const googleCallback: RequestHandler = async (req, res, next) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({
        success: false,
        error: { message: 'Missing authorization code' },
      });
      return;
    }

    const result = await authService.googleLogin(code, getRequestInfo(req));

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

import { RequestHandler } from 'express';
import * as authService from './auth.service.js';
import {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  VerifyEmailInput,
} from './auth.types.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);

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
    await authService.verifyEmail(token);

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
    const result = await authService.login(input);

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

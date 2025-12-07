import { hash } from 'argon2';
import { db } from '../../config/database.js';
import { RegisterInput } from './auth.types.js';
import { generateToken } from '../../common/utils/crypto.js';
import { sendVerificationEmail } from '../../common/services/email.service.js';

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

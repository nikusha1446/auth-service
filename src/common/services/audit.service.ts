import { db } from '../../config/database.js';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'REGISTER'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFIED';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  });
};

export const getAuditLogs = async (
  userId: string,
  limit: number = 10
): Promise<
  {
    id: string;
    action: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }[]
> => {
  return db.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
};

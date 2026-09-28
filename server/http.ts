import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const jsonBody = express.json({ limit: '64kb' });
export const photoBody = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp'],
  limit: 2_000_000
});

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const handleError: ErrorRequestHandler = (cause: unknown, req, res, next) => {
  if (res.headersSent) return next(cause);
  res.setHeader('Cache-Control', 'private, no-store');
  if (cause instanceof ZodError) return void res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: cause.issues });
  if (cause instanceof HttpError) return void res.status(cause.status).json({ error: cause.message });
  if (cause instanceof Error && 'type' in cause) {
    if (cause.type === 'entity.too.large') return void res.status(413).json({ error: 'ข้อมูลมีขนาดใหญ่เกินกำหนด (รูปไม่เกิน 2 MB)' });
    if (cause.type === 'entity.parse.failed') return void res.status(400).json({ error: 'รูปแบบ JSON ไม่ถูกต้อง' });
    if (cause.type === 'encoding.unsupported' || cause.type === 'charset.unsupported') {
      return void res.status(415).json({ error: 'ไม่รองรับรูปแบบการเข้ารหัสข้อมูลนี้' });
    }
  }
  if (cause instanceof Error && 'code' in cause && cause.code === '23505') return void res.status(409).json({ error: 'ข้อมูลนี้มีอยู่แล้ว' });
  console.error('API request failed', { path: req.path, error: cause });
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
};

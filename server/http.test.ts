import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { handleError, HttpError, jsonBody, photoBody } from './http';

describe('HTTP request parsing and errors', () => {
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    const app = express();
    app.use(jsonBody);
    app.post('/json', (_req, res) => res.json({ ok: true }));
    app.put('/photo', photoBody, (req, res) => res.json({ bytes: req.body.length }));
    app.get('/forbidden', () => { throw new HttpError(403, 'ไม่มีสิทธิ์'); });
    app.get('/failure', () => { throw new Error('internal database details'); });
    app.use(handleError);
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('accepts a photo exactly at the frontend 2 MB limit', async () => {
    const response = await fetch(`${origin}/photo`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.alloc(2_000_000) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ bytes: 2_000_000 });
  });

  it('rejects an oversized photo with JSON 413, not 500', async () => {
    const response = await fetch(`${origin}/photo`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.alloc(2_000_001) });
    expect(response.status).toBe(413);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ error: expect.stringContaining('2 MB') });
  });

  it('rejects malformed JSON without echoing request data', async () => {
    const response = await fetch(`${origin}/json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"private-note":' });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'รูปแบบ JSON ไม่ถูกต้อง' });
  });

  it('keeps the JSON request size limit', async () => {
    const response = await fetch(`${origin}/json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: 'x'.repeat(65_536) }) });
    expect(response.status).toBe(413);
  });

  it('returns 415 for an unsupported JSON charset', async () => {
    const response = await fetch(`${origin}/json`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=iso-8859-1' }, body: '{}' });
    expect(response.status).toBe(415);
  });

  it('preserves an explicit authorization error', async () => {
    const response = await fetch(`${origin}/forbidden`);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'ไม่มีสิทธิ์' });
  });

  it('keeps unexpected failures generic and logs them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const response = await fetch(`${origin}/failure`);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
      expect(log).toHaveBeenCalledOnce();
    } finally { log.mockRestore(); }
  });
});

import { describe, expect, it } from 'vitest';
import {
  AppSettingsSchema,
  BridgeMethods,
  HostMessageSchema,
  LogEntrySchema,
  PushEventSchema,
  RpcResponseSchema
} from './contract';

describe('AppSettingsSchema', () => {
  it('accepts a valid settings payload', () => {
    const result = AppSettingsSchema.safeParse({
      theme: 'Dark',
      showLogs: false,
      confirmDeletion: true,
      accentColor: '#3B82F6',
      useSystemAccent: false,
      timeouts: { waitAfterDelete: 500, waitBetweenRetryDeleteAttempts: 500, waitAfterDocumentLoad: 3000 }
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown theme', () => {
    const result = AppSettingsSchema.safeParse({
      theme: 'Neon',
      showLogs: false,
      confirmDeletion: true,
      timeouts: { waitAfterDelete: 500, waitBetweenRetryDeleteAttempts: 500, waitAfterDocumentLoad: 3000 }
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative timeout values', () => {
    const result = AppSettingsSchema.safeParse({
      theme: 'Default',
      showLogs: false,
      confirmDeletion: true,
      timeouts: { waitAfterDelete: -1, waitBetweenRetryDeleteAttempts: 500, waitAfterDocumentLoad: 3000 }
    });
    expect(result.success).toBe(false);
  });
});

describe('LogEntrySchema', () => {
  it('accepts a well-formed log entry', () => {
    const result = LogEntrySchema.safeParse({
      timestamp: '2026-07-24T12:00:00.000Z',
      level: 'error',
      message: 'JS Error: boom'
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-ISO timestamp', () => {
    const result = LogEntrySchema.safeParse({
      timestamp: 'not-a-date',
      level: 'info',
      message: 'hi'
    });
    expect(result.success).toBe(false);
  });
});

describe('RpcResponseSchema', () => {
  it('accepts a success response', () => {
    const result = RpcResponseSchema.safeParse({ id: '1', ok: true, result: { deletedCount: 3 } });
    expect(result.success).toBe(true);
  });

  it('accepts an error response', () => {
    const result = RpcResponseSchema.safeParse({ id: '1', ok: false, error: { message: 'boom' } });
    expect(result.success).toBe(true);
  });

  it('rejects a response missing both result and error', () => {
    const result = RpcResponseSchema.safeParse({ id: '1', ok: true });
    expect(result.success).toBe(false);
  });
});

describe('PushEventSchema / HostMessageSchema', () => {
  it('accepts a progress push event', () => {
    const result = PushEventSchema.safeParse({
      event: 'progress',
      payload: { requestId: 'abc', deletedCount: 2 }
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown event name', () => {
    const result = PushEventSchema.safeParse({ event: 'boom', payload: {} });
    expect(result.success).toBe(false);
  });

  it('HostMessageSchema accepts both RPC responses and push events', () => {
    expect(HostMessageSchema.safeParse({ id: '1', ok: true, result: {} }).success).toBe(true);
    expect(HostMessageSchema.safeParse({ event: 'settingsChanged', payload: {} }).success).toBe(false);
  });
});

describe('BridgeMethods', () => {
  it('validates every declared params/result schema is a usable Zod schema', () => {
    for (const [name, spec] of Object.entries(BridgeMethods)) {
      expect(typeof spec.params.parse, `${name}.params should be a Zod schema`).toBe('function');
      expect(typeof spec.result.parse, `${name}.result should be a Zod schema`).toBe('function');
    }
  });
});

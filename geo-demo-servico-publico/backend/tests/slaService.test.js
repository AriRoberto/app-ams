import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSlaDeadline, classifySlaStatus } from '../services/slaService.js';

test('calculateSlaDeadline returns future date', () => {
  const now = new Date();
  const deadline = calculateSlaDeadline(now);
  assert.ok(deadline > now);
});

test('classifySlaStatus marks violated when deadline passed', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const createdAt = new Date('2025-12-25T12:00:00Z');
  const slaDeadline = new Date('2025-12-28T12:00:00Z');
  const status = classifySlaStatus({ status: 'ABERTA', createdAt, slaDeadline, now });
  assert.equal(status, 'violado');
});

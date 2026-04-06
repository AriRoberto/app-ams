import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../services/demoDataService.js';
import { classifySlaStatus } from '../services/slaService.js';

test('buildDemoDataset generates at least 20 demo records', () => {
  const data = buildDemoDataset({ total: 20, now: new Date('2026-04-06T12:00:00Z') });
  assert.equal(data.length, 20);
});

test('buildDemoDataset contains sla states: violado, atencao e ok', () => {
  const now = new Date('2026-04-06T12:00:00Z');
  const data = buildDemoDataset({ total: 24, now });

  const buckets = data.reduce((acc, item) => {
    const sla = classifySlaStatus({
      status: item.status,
      createdAt: item.createdAt,
      slaDeadline: item.slaDeadline,
      now
    });
    acc[sla] += 1;
    return acc;
  }, { ok: 0, atencao: 0, violado: 0 });

  assert.ok(buckets.ok > 0);
  assert.ok(buckets.atencao > 0);
  assert.ok(buckets.violado > 0);
});

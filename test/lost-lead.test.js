const test = require('node:test');
const assert = require('node:assert/strict');
const { LostLeadRecoveryEngine } = require('../src/index.js');

test('LostLead: identifies ghosted quotes older than 7 days', () => {
  const engine = new LostLeadRecoveryEngine({ reactivationBenchmark: 0.15 });
  const asOf = new Date('2026-10-05T12:00:00Z');

  const leads = [
    {
      id: 'l1',
      name: 'Tech Corp',
      quoteAmount: 8500,
      createdAt: '2026-09-10T12:00:00Z',
      lastTouchAt: '2026-09-20T12:00:00Z', // 15 days ago
      touchCount: 2,
      status: 'QUOTE_SENT'
    },
    {
      id: 'l2',
      name: 'Closed Customer',
      dealValue: 5000,
      createdAt: '2026-09-01T12:00:00Z',
      status: 'CLOSED_WON'
    }
  ];

  const report = engine.auditCrmDump(leads, asOf);
  assert.equal(report.totalAudited, 2);
  assert.equal(report.recoverableCount, 1);
  assert.equal(report.cohorts.ghostedQuotes, 1);
  assert.equal(report.totalDormantValue, 8500);
  assert.equal(report.projectedReclaimedRevenue, Math.round(8500 * 0.15));
});

test('LostLead: flags single-touch abandoned leads older than 14 days', () => {
  const engine = new LostLeadRecoveryEngine();
  const asOf = new Date('2026-10-05T12:00:00Z');

  const leads = [
    {
      id: 'l3',
      name: 'Inbound Inquiry LLC',
      service: 'Web Development',
      dealValue: 3000,
      createdAt: '2026-09-01T12:00:00Z',
      lastTouchAt: '2026-09-01T14:00:00Z', // 34 days dormant
      touchCount: 1,
      status: 'CONTACTED'
    }
  ];

  const report = engine.auditCrmDump(leads, asOf);
  assert.equal(report.recoverableCount, 1);
  assert.equal(report.cohorts.singleTouch, 1);
  assert.ok(report.queue[0].hook.includes('Web Development'));
});

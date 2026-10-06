const test = require('node:test');
const assert = require('node:assert/strict');
const { LostLeadRecoveryEngine } = require('../src/index.js');

test('LostLead Edge Cases: handles empty lead list without throwing', () => {
  const engine = new LostLeadRecoveryEngine();
  const res = engine.auditCrmDump([]);
  assert.equal(res.totalAudited, 0);
  assert.equal(res.recoverableCount, 0);
  assert.equal(res.totalDormantValue, 0);
});

test('LostLead Edge Cases: ignores leads created today', () => {
  const engine = new LostLeadRecoveryEngine();
  const today = new Date().toISOString();
  const res = engine.auditCrmDump([{ id: 'fresh', createdAt: today, touchCount: 0, status: 'NEW' }]);
  assert.equal(res.recoverableCount, 0);
});

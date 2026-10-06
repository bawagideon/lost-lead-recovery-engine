/**
 * @gideon/lost-lead-recovery-engine
 * Project #04 in the Master 50 Business Problem & Revenue Leak Weapons
 * 
 * Commercial Mission:
 * Scans dormant CRM dumps to uncover forgotten quotes, single-touch leads,
 * and silent prospects, generating high-conversion reactivation queues.
 */

class LostLeadRecoveryEngine {
  constructor(options = {}) {
    this.reactivationBenchmark = options.reactivationBenchmark || 0.12; // 12% standard reactivation conversion
  }

  auditCrmDump(leads, asOfDate = new Date()) {
    const now = new Date(asOfDate).getTime();
    const audited = [];

    leads.forEach(lead => {
      const created = new Date(lead.createdAt || lead.receivedAt).getTime();
      const lastTouch = lead.lastTouchAt ? new Date(lead.lastTouchAt).getTime() : null;
      const touchesCount = Number(lead.touchCount || (lastTouch ? 1 : 0));
      const hasQuote = Boolean(lead.quoteAmount || lead.quotedAt);
      const isClosed = ['CLOSED_WON', 'CLOSED_LOST', 'UNQUALIFIED'].includes(lead.status);

      if (isClosed) return;

      const daysDormant = lastTouch 
        ? Math.floor((now - lastTouch) / (1000 * 60 * 60 * 24))
        : Math.floor((now - created) / (1000 * 60 * 60 * 24));

      let leakType = null;
      let hook = '';

      if (hasQuote && daysDormant >= 7) {
        leakType = 'GHOSTED_QUOTE';
        hook = `Hi ${lead.name || 'there'}, following up on the proposal we sent over. Did your team have any questions on the scope or timeline?`;
      } else if (touchesCount === 1 && daysDormant >= 14) {
        leakType = 'SINGLE_TOUCH_ABANDONED';
        hook = `Hi ${lead.name || 'there'}, wanted to check back in regarding your inquiry about ${lead.service || 'our services'}. Is this still a priority this quarter?`;
      } else if (touchesCount === 0 && daysDormant >= 3) {
        leakType = 'ZERO_TOUCH_NEGLECT';
        hook = `Hi ${lead.name || 'there'}, apologies for our previous delay! I'm reviewing your inquiry personally today. Do you have 5 minutes for a quick chat?`;
      }

      if (leakType) {
        audited.push({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          dealValue: Number(lead.dealValue || lead.quoteAmount || 2000),
          daysDormant,
          touchesCount,
          leakType,
          hook
        });
      }
    });

    const totalDormantValue = audited.reduce((sum, l) => sum + l.dealValue, 0);
    const projectedReclaimedRevenue = Math.round(totalDormantValue * this.reactivationBenchmark);

    return {
      totalAudited: leads.length,
      recoverableCount: audited.length,
      totalDormantValue,
      projectedReclaimedRevenue,
      cohorts: {
        ghostedQuotes: audited.filter(l => l.leakType === 'GHOSTED_QUOTE').length,
        singleTouch: audited.filter(l => l.leakType === 'SINGLE_TOUCH_ABANDONED').length,
        zeroTouch: audited.filter(l => l.leakType === 'ZERO_TOUCH_NEGLECT').length
      },
      queue: audited
    };
  }
}

module.exports = {
  LostLeadRecoveryEngine
};

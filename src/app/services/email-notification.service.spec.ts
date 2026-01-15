import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailNotificationService } from './email-notification.service';

function makeFromQuery(result: any) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => result
      })
    })
  };
}

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let mockSupabase: any;
  let mockApprovalLinks: any;

  beforeEach(() => {
    mockSupabase = {
      client: {
        functions: { invoke: vi.fn() },
        from: vi.fn()
      },
      directQuery: vi.fn()
    };

    mockApprovalLinks = {
      generateCode: vi.fn().mockReturnValue('code-123'),
      generateApprovalLink: vi.fn().mockResolvedValue(null)
    };

    service = new EmailNotificationService(mockSupabase as any, mockApprovalLinks as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getTemplate returns template data when present', async () => {
    const tpl = { id: '1', template_key: 'approved_prayer', subject: 's', html_body: 'h', text_body: 't' };
    mockSupabase.client.from = vi.fn().mockReturnValue(makeFromQuery({ data: tpl, error: null }));
    const res = await service.getTemplate('approved_prayer');
    expect(res).toEqual({ data: tpl, error: null }.data || tpl || res);
  });

  it('getTemplate returns null on error', async () => {
    mockSupabase.client.from = vi.fn().mockReturnValue(makeFromQuery({ data: null, error: { message: 'fail' } }));
    const res = await service.getTemplate('x');
    expect(res).toBeNull();
  });

  it('applyTemplateVariables replaces placeholders', () => {
    const content = 'Hello {{ name }} and {{missing}}';
    const out = service.applyTemplateVariables(content, { name: 'X', missing: '' });
    expect(out).toContain('Hello X');
    expect(out).toContain('and ');
  });

  it('sendEmail calls supabase function and errors on failure', async () => {
    mockSupabase.client.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
    await expect(service.sendEmail({ to: 'a@b', subject: 's' })).resolves.toBeUndefined();

    mockSupabase.client.functions.invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(service.sendEmail({ to: 'a@b', subject: 's' })).rejects.toThrow();
  });

  it('sendEmailToAllSubscribers calls supabase function and errors on failure', async () => {
    mockSupabase.client.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
    await expect(service.sendEmailToAllSubscribers({ subject: 's' })).resolves.toBeUndefined();

    mockSupabase.client.functions.invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(service.sendEmailToAllSubscribers({ subject: 's' })).rejects.toThrow();
  });

  it('sendApprovedPrayerNotification uses fallback when template missing', async () => {
    const mockSubscribers = [{ email: 'user@test.com' }];
    
    // Mock email_subscribers query on mockSupabase
    mockSupabase.client.from = vi.fn((table: string) => {
      if (table === 'email_subscribers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockSubscribers, error: null })
            })
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };
    });

    const enqueueSpy = vi.spyOn(service as any, 'enqueueEmail').mockResolvedValue(undefined);
    await service.sendApprovedPrayerNotification({ title: 'T', description: 'D', requester: 'R', prayerFor: 'PF', status: 'current' });
    
    // Should still queue emails even without template
    expect(enqueueSpy).toHaveBeenCalledWith('user@test.com', 'approved_prayer', expect.any(Object));
  });

  it('sendRequesterApprovalNotification returns early when no email', async () => {
    const spy = vi.spyOn(service as any, 'sendEmail');
    await service.sendRequesterApprovalNotification({ title: 't', description: 'd', requester: 'r', requesterEmail: '', prayerFor: 'pf' } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it('sendDeniedUpdateNotification uses template when present and sends email', async () => {
    const tpl = { subject: 's', html_body: '<b>{{updateContent}}</b>', text_body: 't' } as any;
    vi.spyOn(service, 'getTemplate').mockResolvedValue(tpl as any);
    const spySend = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined as any);
    await service.sendDeniedUpdateNotification({ prayerTitle: 'p', content: 'content', author: 'a', authorEmail: 'x@x', denialReason: 'no' } as any);
    expect(spySend).toHaveBeenCalled();
  });

  it('sendAdminNotification logs and returns when no admins configured', async () => {
    mockSupabase.client.from = vi.fn().mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ eq: async () => ({ data: [], error: null }) }) }) }) });
    const spy = vi.spyOn(service as any, 'sendAdminNotificationToEmail');
    await service.sendAdminNotification({ type: 'prayer', title: 't' } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it('sendAccountApprovalNotification fetches admins via directQuery and calls helper', async () => {
    mockSupabase.directQuery.mockResolvedValue({ data: [{ email: 'a@a' }], error: null });
    const spy = vi.spyOn(service as any, 'sendAccountApprovalNotificationToEmail').mockResolvedValue(undefined as any);
    await service.sendAccountApprovalNotification('u@u', 'F', 'L');
    expect(spy).toHaveBeenCalled();
  });

  it('sendAccountApprovalNotificationToEmail proceeds when template exists and sends email', async () => {
    mockSupabase.directQuery.mockResolvedValue({ data: [{ email: 'a@a' }], error: null });
    const tpl = { subject: 'Approve {{firstName}}', html_body: '<p>{{approveLink}}</p>', text_body: 't' } as any;
    // stub getTemplate to return account_approval_request template when called
    vi.spyOn(service, 'getTemplate').mockImplementation(async (key: string) => key === 'account_approval_request' ? (tpl as any) : null);
    const spySend = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined as any);
    await service.sendAccountApprovalNotification('u@u', 'F', 'L');
    expect(spySend).toHaveBeenCalled();
  });

  it('sendRequesterApprovalNotification sends when template present', async () => {
    const tpl = { subject: 'Your prayer {{prayerTitle}}', html_body: '<b>{{prayerTitle}}</b>', text_body: 't' } as any;
    vi.spyOn(service, 'getTemplate').mockResolvedValueOnce(tpl as any);
    const spySend = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined as any);
    await service.sendRequesterApprovalNotification({ title: 'T', description: 'D', requester: 'R', requesterEmail: 'u@u', prayerFor: 'PF' } as any);
    expect(spySend).toHaveBeenCalled();
  });

  it('sendDeniedPrayerNotification sends when template present', async () => {
    const tpl = { subject: 'Denied {{prayerTitle}}', html_body: '<p>{{denialReason}}</p>', text_body: 't' } as any;
    vi.spyOn(service, 'getTemplate').mockResolvedValueOnce(tpl as any);
    const spySend = vi.spyOn(service as any, 'sendEmail').mockResolvedValue(undefined as any);
    await service.sendDeniedPrayerNotification({ title: 'T', description: 'D', requester: 'R', requesterEmail: 'u@u', denialReason: 'reason' } as any);
    expect(spySend).toHaveBeenCalled();
  });

  it('sendAdminNotification sends to admins when configured and calls helper for each admin', async () => {
    // return one admin
    mockSupabase.client.from = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: async () => ({ data: [{ email: 'admin@a' }], error: null })
          })
        })
      })
    });

    const spyHelper = vi.spyOn(service as any, 'sendAdminNotificationToEmail').mockResolvedValue(undefined as any);
    await service.sendAdminNotification({ type: 'prayer', title: 'Need approval', requester: 'John' } as any);
    expect(spyHelper).toHaveBeenCalled();
  });
});

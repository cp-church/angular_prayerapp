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
    vi.spyOn(service, 'getTemplate').mockResolvedValue(null);
    const spy = vi.spyOn(service as any, 'sendEmailToAllSubscribers').mockResolvedValue(undefined as any);
    await service.sendApprovedPrayerNotification({ title: 'T', description: 'D', requester: 'R', prayerFor: 'PF', status: 'current' });
    expect(spy).toHaveBeenCalled();
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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  EmailNotificationService,
  SendEmailOptions,
  ApprovedPrayerPayload,
  ApprovedUpdatePayload,
  RequesterApprovalPayload,
  DeniedPrayerPayload,
  DeniedUpdatePayload,
  AdminNotificationPayload
} from './email-notification.service';
import { SupabaseService } from './supabase.service';
import { ApprovalLinksService } from './approval-links.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let mockSupabaseService: any;
  let mockApprovalLinksService: any;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      functions: {
        invoke: vi.fn()
      }
    };

    mockSupabaseService = {
      client: mockSupabaseClient
    } as any;

    mockApprovalLinksService = {
      createApprovalLink: vi.fn().mockReturnValue('mock-approval-link')
    } as any;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:4200' },
      writable: true
    });

    service = new EmailNotificationService(mockSupabaseService, mockApprovalLinksService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML</p>',
        textBody: 'Test Text'
      };

      await expect(service.sendEmail(options)).resolves.not.toThrow();
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Test Subject',
          htmlBody: '<p>Test HTML</p>',
          textBody: 'Test Text',
          replyTo: undefined,
          fromName: undefined
        }
      });
    });

    it('should handle error from supabase function', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' }
      });

      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject'
      };

      await expect(service.sendEmail(options)).rejects.toThrow('Function error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email:', expect.any(Object));
    });

    it('should handle unsuccessful response', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: false, error: 'Email service error' },
        error: null
      });

      const options: SendEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject'
      };

      await expect(service.sendEmail(options)).rejects.toThrow('Email service error');
    });

    it('should send email with all options', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const options: SendEmailOptions = {
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML</p>',
        textBody: 'Test Text',
        replyTo: 'reply@example.com',
        fromName: 'Test Sender'
      };

      await service.sendEmail(options);
      
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
          replyTo: 'reply@example.com',
          fromName: 'Test Sender'
        })
      });
    });
  });

  describe('getTemplate', () => {
    it('should fetch template successfully', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'approved_prayer',
        name: 'Approved Prayer',
        subject: 'New Prayer: {{prayerTitle}}',
        html_body: '<p>{{prayerDescription}}</p>',
        text_body: '{{prayerDescription}}',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      const result = await service.getTemplate('approved_prayer');

      expect(result).toEqual(mockTemplate);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_templates');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('template_key', 'approved_prayer');
    });

    it('should return null on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Template not found' }
      });

      const result = await service.getTemplate('non_existent');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching template:', expect.any(Object));
    });
  });

  describe('applyTemplateVariables', () => {
    it('should replace template variables', () => {
      const template = 'Hello {{name}}, welcome to {{app}}!';
      const variables = { name: 'John', app: 'Prayer App' };

      const result = service.applyTemplateVariables(template, variables);

      expect(result).toBe('Hello John, welcome to Prayer App!');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} said: "Hello {{name}}"';
      const variables = { name: 'Alice' };

      const result = service.applyTemplateVariables(template, variables);

      expect(result).toBe('Alice said: "Hello Alice"');
    });

    it('should handle whitespace in placeholders', () => {
      const template = '{{ name }} {{ app }}';
      const variables = { name: 'Bob', app: 'Test App' };

      const result = service.applyTemplateVariables(template, variables);

      expect(result).toBe('Bob Test App');
    });

    it('should replace undefined values with empty string', () => {
      const template = 'Name: {{name}}, Age: {{age}}';
      const variables = { name: 'Charlie', age: undefined as any };

      const result = service.applyTemplateVariables(template, variables);

      expect(result).toBe('Name: Charlie, Age: ');
    });
  });

  describe('sendEmailToAllSubscribers', () => {
    it('should send email to all subscribers', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendEmailToAllSubscribers({
        subject: 'Test Subject',
        htmlBody: '<p>Test</p>',
        textBody: 'Test'
      });

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          action: 'send_to_all_subscribers',
          subject: 'Test Subject',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
          replyTo: undefined,
          fromName: undefined
        }
      });
    });

    it('should handle error from bulk email', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Bulk email error' }
      });

      await expect(service.sendEmailToAllSubscribers({
        subject: 'Test'
      })).rejects.toThrow('Bulk email error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send bulk email:', expect.any(Object));
    });

    it('should handle unsuccessful bulk email response', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: false, error: 'Bulk send failed' },
        error: null
      });

      await expect(service.sendEmailToAllSubscribers({
        subject: 'Test'
      })).rejects.toThrow('Bulk send failed');
    });
  });

  describe('sendApprovedPrayerNotification', () => {
    const mockPayload: ApprovedPrayerPayload = {
      title: 'Test Prayer',
      description: 'Test Description',
      requester: 'John Doe',
      prayerFor: 'Jane Doe',
      status: 'current'
    };

    it('should send notification with template', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'approved_prayer',
        name: 'Approved Prayer',
        subject: 'New Prayer: {{prayerTitle}}',
        html_body: '<p>{{prayerDescription}}</p>',
        text_body: '{{prayerDescription}}',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendApprovedPrayerNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          subject: 'New Prayer: Test Prayer',
          action: 'send_to_all_subscribers'
        })
      }));
    });

    it('should use fallback when template not found', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Template not found' }
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendApprovedPrayerNotification(mockPayload);

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          subject: 'New Prayer Request: Test Prayer'
        })
      }));
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));

      await expect(service.sendApprovedPrayerNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendApprovedPrayerNotification:', expect.any(Error));
    });
  });

  describe('sendApprovedUpdateNotification', () => {
    const mockPayload: ApprovedUpdatePayload = {
      prayerTitle: 'Test Prayer',
      content: 'Update content',
      author: 'John Doe',
      markedAsAnswered: false
    };

    it('should send notification for update', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'approved_update',
        name: 'Approved Update',
        subject: 'Prayer Update: {{prayerTitle}}',
        html_body: '<p>{{updateContent}}</p>',
        text_body: '{{updateContent}}',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendApprovedUpdateNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled();
    });

    it('should use prayer_answered template when marked as answered', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'prayer_answered',
        name: 'Prayer Answered',
        subject: 'Prayer Answered: {{prayerTitle}}',
        html_body: '<p>Great news!</p>',
        text_body: 'Great news!',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendApprovedUpdateNotification({
        ...mockPayload,
        markedAsAnswered: true
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_templates');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('template_key', 'prayer_answered');
    });

    it('should use fallback when template not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendApprovedUpdateNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          subject: 'Prayer Update: Test Prayer'
        })
      }));
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));

      await expect(service.sendApprovedUpdateNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendApprovedUpdateNotification:', expect.any(Error));
    });
  });

  describe('sendRequesterApprovalNotification', () => {
    const mockPayload: RequesterApprovalPayload = {
      title: 'Test Prayer',
      description: 'Test Description',
      requester: 'John Doe',
      requesterEmail: 'john@example.com',
      prayerFor: 'Jane Doe'
    };

    it('should send email to requester', async () => {
      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendRequesterApprovalNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          to: ['john@example.com'],
          subject: 'Your Prayer Request Has Been Approved: Test Prayer'
        })
      }));
    });

    it('should not send email if requester email is missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.sendRequesterApprovalNotification({
        ...mockPayload,
        requesterEmail: ''
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('No email address for prayer requester');
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Send error'));

      await expect(service.sendRequesterApprovalNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendRequesterApprovalNotification:', expect.any(Error));
    });
  });

  describe('sendDeniedPrayerNotification', () => {
    const mockPayload: DeniedPrayerPayload = {
      title: 'Test Prayer',
      description: 'Test Description',
      requester: 'John Doe',
      requesterEmail: 'john@example.com',
      denialReason: 'Inappropriate content'
    };

    it('should send denial notification with fallback', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Template not found' }
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedPrayerNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          to: ['john@example.com'],
          subject: 'Prayer Request Not Approved: Test Prayer'
        })
      }));
    });

    it('should use template when available', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'denied_prayer',
        name: 'Denied Prayer',
        subject: 'Prayer Not Approved: {{prayerTitle}}',
        html_body: '<p>{{denialReason}}</p>',
        text_body: '{{denialReason}}',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedPrayerNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled();
    });

    it('should not send email if requester email is missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.sendDeniedPrayerNotification({
        ...mockPayload,
        requesterEmail: ''
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('No email address for denied prayer requester');
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should handle template fetch error', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSupabaseClient.single.mockRejectedValue(new Error('Template fetch error'));

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedPrayerNotification(mockPayload);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to fetch denied_prayer template, using fallback:', expect.any(Error));
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));
      mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Send error'));

      await expect(service.sendDeniedPrayerNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendDeniedPrayerNotification:', expect.any(Error));
    });
  });

  describe('sendDeniedUpdateNotification', () => {
    const mockPayload: DeniedUpdatePayload = {
      prayerTitle: 'Test Prayer',
      content: 'Update content',
      author: 'John Doe',
      authorEmail: 'john@example.com',
      denialReason: 'Inappropriate language'
    };

    it('should send denial notification for update', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedUpdateNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
        body: expect.objectContaining({
          to: ['john@example.com'],
          subject: 'Prayer Update Not Approved: Test Prayer'
        })
      }));
    });

    it('should use template when available', async () => {
      const mockTemplate = {
        id: '1',
        template_key: 'denied_update',
        name: 'Denied Update',
        subject: 'Update Not Approved: {{prayerTitle}}',
        html_body: '<p>{{denialReason}}</p>',
        text_body: '{{denialReason}}',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockTemplate,
        error: null
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedUpdateNotification(mockPayload);

      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled();
    });

    it('should not send email if author email is missing', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.sendDeniedUpdateNotification({
        ...mockPayload,
        authorEmail: ''
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('No email address for denied update author');
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should handle template fetch error', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSupabaseClient.single.mockRejectedValue(new Error('Template fetch error'));

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendDeniedUpdateNotification(mockPayload);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to fetch denied_update template, using fallback:', expect.any(Error));
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Send error'));

      await expect(service.sendDeniedUpdateNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendDeniedUpdateNotification:', expect.any(Error));
    });
  });

  describe('sendAdminNotification', () => {
    const mockPayload: AdminNotificationPayload = {
      type: 'prayer',
      title: 'Test Prayer',
      description: 'Test Description',
      requester: 'John Doe'
    };

    it('should send notifications to all admins', async () => {
      const mockAdmins = [
        { email: 'admin1@example.com' },
        { email: 'admin2@example.com' }
      ];

      // Reset the mock chain for this test
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockAdmins,
            error: null
          })
        })
      });

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await service.sendAdminNotification(mockPayload);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_subscribers');
      // Should call eq three times for is_admin, is_active, and receive_admin_emails
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('should handle error fetching admins', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      await service.sendAdminNotification(mockPayload);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching admin emails:', expect.any(Object));
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should warn when no admins configured', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      await service.sendAdminNotification(mockPayload);

      expect(consoleWarnSpy).toHaveBeenCalledWith('No admins configured to receive notifications. Please enable admin email notifications in Admin User Management.');
      expect(mockSupabaseClient.functions.invoke).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSupabaseClient.select.mockRejectedValue(new Error('Database error'));

      await expect(service.sendAdminNotification(mockPayload)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in sendAdminNotification:', expect.any(Error));
    });
  });
});

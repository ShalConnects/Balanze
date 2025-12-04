// Mock email service for development testing
export class MockEmailService {
  private static instance: MockEmailService;
  private emailLog: Array<{to: string, subject: string, content: string, timestamp: Date}> = [];

  static getInstance(): MockEmailService {
    if (!MockEmailService.instance) {
      MockEmailService.instance = new MockEmailService();
    }
    return MockEmailService.instance;
  }

  // Mock email sending
  async sendEmail(to: string, subject: string, content: string) {
    const emailData = {
      to,
      subject,
      content,
      timestamp: new Date()
    };
    
    this.emailLog.push(emailData);
    
    
    // Simulate email delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  // Get email log
  getEmailLog() {
    return [...this.emailLog];
  }

  // Clear email log
  clearEmailLog() {
    this.emailLog = [];
  }

  // Get emails for specific recipient
  getEmailsForRecipient(recipientEmail: string) {
    return this.emailLog.filter(email => email.to === recipientEmail);
  }
}

export const mockEmailService = MockEmailService.getInstance(); 


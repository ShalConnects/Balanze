import type { Client, Order, Invoice, Task } from '../types/client';
import type { AppUser } from '../store/authStore';

export type EmailType = 
  | 'follow-up' 
  | 're-connect' 
  | 'thank-you' 
  | 'check-in' 
  | 'payment-reminder' 
  | 'project-update' 
  | 'proposal';

export type EmailTone = 'professional' | 'friendly' | 'balanced';

export interface EmailSuggestion {
  type: EmailType;
  context: string;
  email: string;
}

export interface ClientContext {
  emailTypes: EmailType[];
  context: {
    lastActivityDays?: number;
    overdueInvoices?: Invoice[];
    completedTasks?: Task[];
    activeTasks?: Task[];
    waitingOnClientTasks?: Task[];
    recentPayments?: Invoice[];
    totalSpent?: number;
    averageDaysBetweenInteractions?: number;
  };
}

/**
 * Calculate days since last activity
 */
function getDaysSinceLastActivity(
  client: Client,
  orders: Order[],
  invoices: Invoice[],
  tasks: Task[]
): number {
  const dates: Date[] = [];
  
  // Get last order date
  if (orders.length > 0) {
    const lastOrder = orders.sort((a, b) => 
      new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
    )[0];
    dates.push(new Date(lastOrder.order_date));
  }
  
  // Get last invoice date (sent or paid)
  if (invoices.length > 0) {
    const lastInvoice = invoices.sort((a, b) => 
      new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()
    )[0];
    dates.push(new Date(lastInvoice.invoice_date));
    if (lastInvoice.last_sent_at) {
      dates.push(new Date(lastInvoice.last_sent_at));
    }
    if (lastInvoice.paid_date) {
      dates.push(new Date(lastInvoice.paid_date));
    }
  }
  
  // Get last task update date
  if (tasks.length > 0) {
    const lastTask = tasks.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
    dates.push(new Date(lastTask.updated_at));
    if (lastTask.completed_date) {
      dates.push(new Date(lastTask.completed_date));
    }
  }
  
  // Get client created/updated date as fallback
  dates.push(new Date(client.created_at));
  dates.push(new Date(client.updated_at));
  
  if (dates.length === 0) return 0;
  
  const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate average days between interactions
 */
function calculateAverageDaysBetweenInteractions(
  orders: Order[],
  invoices: Invoice[],
  tasks: Task[]
): number {
  const allDates: Date[] = [];
  
  orders.forEach(order => {
    allDates.push(new Date(order.order_date));
    if (order.updated_at) allDates.push(new Date(order.updated_at));
  });
  
  invoices.forEach(invoice => {
    allDates.push(new Date(invoice.invoice_date));
    if (invoice.last_sent_at) allDates.push(new Date(invoice.last_sent_at));
    if (invoice.paid_date) allDates.push(new Date(invoice.paid_date));
  });
  
  tasks.forEach(task => {
    allDates.push(new Date(task.created_at));
    if (task.completed_date) allDates.push(new Date(task.completed_date));
  });
  
  if (allDates.length < 2) return 30; // Default if not enough data
  
  const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    gaps.push(Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
  
  if (gaps.length === 0) return 30;
  
  const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return Math.round(average);
}

/**
 * Calculate adaptive inactivity threshold
 */
function calculateInactivityThreshold(
  client: Client,
  averageDaysBetweenInteractions: number
): number {
  let threshold = averageDaysBetweenInteractions * 1.5; // 1.5x average
  
  // Adjust based on tags
  if (client.tags?.includes('Long-term') || client.tags?.includes('VIP')) {
    threshold *= 1.5; // Longer threshold for long-term clients
  } else if (client.tags?.includes('One-time')) {
    threshold *= 0.7; // Shorter threshold for one-time clients
  }
  
  // Adjust based on status
  if (client.status === 'inactive') {
    threshold = Math.max(threshold, 60); // At least 60 days for inactive
  } else if (client.status === 'active') {
    threshold = Math.max(threshold, 20); // At least 20 days for active
  }
  
  // Default fallback
  if (threshold < 20) threshold = 20;
  if (threshold > 90) threshold = 90;
  
  return Math.round(threshold);
}

/**
 * Determine email tone based on client data
 */
export function determineEmailTone(client: Client): EmailTone {
  // Check tags for tone indicators
  const professionalTags = ['Corporate', 'VIP', 'Premium'];
  const friendlyTags = ['Repeat Client', 'Fiverr', 'Upwork', 'Freelancer'];
  
  const hasProfessionalTag = client.tags?.some(tag => 
    professionalTags.some(pt => tag.includes(pt))
  );
  const hasFriendlyTag = client.tags?.some(tag => 
    friendlyTags.some(ft => tag.includes(ft))
  );
  
  // Company name presence suggests professional
  if (client.company_name || hasProfessionalTag) {
    return 'professional';
  }
  
  // Personal names or friendly tags suggest friendly
  if (hasFriendlyTag || (!client.company_name && client.name.split(' ').length <= 2)) {
    return 'friendly';
  }
  
  // Analyze notes for language style (simple check)
  if (client.notes) {
    const notesLower = client.notes.toLowerCase();
    const formalWords = ['regarding', 'please be advised', 'pursuant', 'hereby'];
    const casualWords = ['hey', 'thanks', 'awesome', 'great'];
    
    const hasFormal = formalWords.some(word => notesLower.includes(word));
    const hasCasual = casualWords.some(word => notesLower.includes(word));
    
    if (hasFormal) return 'professional';
    if (hasCasual) return 'friendly';
  }
  
  // Source-based tone
  if (client.source === 'Website' || client.source === 'Referral') {
    return 'professional';
  }
  
  return 'balanced';
}

/**
 * Analyze client context and determine relevant email types
 */
export function analyzeClientContext(
  client: Client,
  orders: Order[],
  invoices: Invoice[],
  tasks: Task[]
): ClientContext {
  const emailTypes: EmailType[] = [];
  const context: ClientContext['context'] = {};
  
  // Calculate last activity
  const lastActivityDays = getDaysSinceLastActivity(client, orders, invoices, tasks);
  context.lastActivityDays = lastActivityDays;
  
  // Calculate average days between interactions
  const avgDays = calculateAverageDaysBetweenInteractions(orders, invoices, tasks);
  context.averageDaysBetweenInteractions = avgDays;
  
  // Check for overdue invoices
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status !== 'overdue' && inv.payment_status !== 'unpaid') return false;
    const dueDate = new Date(inv.due_date);
    const now = new Date();
    return now > dueDate;
  });
  if (overdueInvoices.length > 0) {
    context.overdueInvoices = overdueInvoices;
    emailTypes.push('payment-reminder');
  }
  
  // Check for completed tasks (recently - within last 14 days)
  const completedTasks = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completed_date) return false;
    const completedDate = new Date(task.completed_date);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 14;
  });
  if (completedTasks.length > 0) {
    context.completedTasks = completedTasks;
    emailTypes.push('follow-up');
    emailTypes.push('thank-you');
  }
  
  // Check for tasks waiting on client
  const waitingOnClientTasks = tasks.filter(task => 
    task.status === 'waiting_on_client'
  );
  if (waitingOnClientTasks.length > 0) {
    context.waitingOnClientTasks = waitingOnClientTasks;
    emailTypes.push('check-in');
  }
  
  // Check for active in-progress tasks
  const activeTasks = tasks.filter(task => 
    task.status === 'in_progress' || task.status === 'waiting_on_me'
  );
  if (activeTasks.length > 0) {
    context.activeTasks = activeTasks;
    emailTypes.push('project-update');
  }
  
  // Check for recent payments (within last 7 days)
  const recentPayments = invoices.filter(inv => {
    if (inv.payment_status !== 'paid' || !inv.paid_date) return false;
    const paidDate = new Date(inv.paid_date);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  });
  if (recentPayments.length > 0) {
    context.recentPayments = recentPayments;
    if (!emailTypes.includes('thank-you')) {
      emailTypes.push('thank-you');
    }
  }
  
  // Calculate total spent
  const totalSpent = invoices
    .filter(inv => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  context.totalSpent = totalSpent;
  
  // Check for re-connect opportunity (adaptive threshold)
  const threshold = calculateInactivityThreshold(client, avgDays);
  if (lastActivityDays >= threshold && client.status !== 'archived') {
    emailTypes.push('re-connect');
  }
  
  // Check for proposal/quote opportunity
  if (
    client.status === 'active' && 
    orders.length === 0 && 
    invoices.length === 0 &&
    tasks.length === 0 &&
    lastActivityDays < 30
  ) {
    emailTypes.push('proposal');
  }
  
  // Remove duplicates
  const uniqueEmailTypes = Array.from(new Set(emailTypes));
  
  return {
    emailTypes: uniqueEmailTypes,
    context
  };
}

/**
 * Replace placeholders in email template
 */
function replacePlaceholders(
  template: string,
  client: Client,
  userProfile: AppUser | null,
  context?: ClientContext['context']
): string {
  let email = template;
  
  // Client placeholders
  email = email.replace(/\[Client Name\]/g, client.name);
  email = email.replace(/\[Client First Name\]/g, client.name.split(' ')[0]);
  email = email.replace(/\[Company Name\]/g, client.company_name || 'your company');
  
  // User placeholders
  const userName = userProfile?.fullName || 'Your Name';
  email = email.replace(/\[Your Name\]/g, userName);
  
  // Context placeholders
  if (context) {
    if (context.overdueInvoices && context.overdueInvoices.length > 0) {
      const totalOverdue = context.overdueInvoices.reduce(
        (sum, inv) => sum + inv.total_amount,
        0
      );
      const currency = context.overdueInvoices[0]?.currency || 'USD';
      email = email.replace(/\[Overdue Amount\]/g, `${currency} ${totalOverdue.toFixed(2)}`);
      email = email.replace(/\[Overdue Count\]/g, context.overdueInvoices.length.toString());
      if (context.overdueInvoices[0]) {
        email = email.replace(/\[Invoice Number\]/g, context.overdueInvoices[0].invoice_number);
        const dueDate = new Date(context.overdueInvoices[0].due_date);
        email = email.replace(/\[Due Date\]/g, dueDate.toLocaleDateString());
      }
    }
    
    if (context.completedTasks && context.completedTasks.length > 0) {
      email = email.replace(/\[Task Name\]/g, context.completedTasks[0].title);
    }
    
    if (context.activeTasks && context.activeTasks.length > 0) {
      email = email.replace(/\[Project Name\]/g, context.activeTasks[0].title);
    }
    
    if (context.lastActivityDays !== undefined) {
      email = email.replace(/\[Days Since Last Contact\]/g, context.lastActivityDays.toString());
    }
  }
  
  return email;
}

/**
 * Generate email template based on type, client data, and tone
 */
export function generateEmailTemplate(
  client: Client,
  emailType: EmailType,
  tone: EmailTone,
  context: ClientContext['context'],
  userProfile: AppUser | null
): string {
  let template = '';
  
  // Base templates by type and tone
  switch (emailType) {
    case 'follow-up':
      if (tone === 'professional') {
        template = `Dear ${client.name},

I hope this message finds you well. I wanted to follow up regarding the recent completion of [Task Name].

I trust everything is meeting your expectations. If you have any questions or need any adjustments, please don't hesitate to reach out.

I look forward to hearing from you.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Hope you're doing well! I wanted to check in about [Task Name] that we just finished.

Everything should be all set, but let me know if you need anything changed or have any questions!

Thanks,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

I wanted to follow up on [Task Name] that we recently completed.

Please let me know if everything looks good or if you need any changes.

Best,
[Your Name]`;
      }
      break;
      
    case 're-connect':
      const daysText = context.lastActivityDays && context.lastActivityDays > 60 
        ? 'a while' 
        : `about ${context.lastActivityDays || 30} days`;
      
      if (tone === 'professional') {
        template = `Dear ${client.name},

I hope this message finds you well. I wanted to reach out as it's been ${daysText} since we last connected.

I wanted to check in and see how things are going on your end. If there's anything I can assist you with, please don't hesitate to reach out.

I look forward to hearing from you.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Hope you're doing well! It's been ${daysText} since we last worked together, and I wanted to check in.

Is there anything I can help you with? I'm always here if you need anything!

Looking forward to hearing from you!

Best,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

I wanted to reach out - it's been ${daysText} since we last connected.

I wanted to check in and see if there's anything I can help you with.

Best,
[Your Name]`;
      }
      break;
      
    case 'thank-you':
      if (tone === 'professional') {
        template = `Dear ${client.name},

Thank you for your recent payment. I truly appreciate your business and the trust you place in our services.

If you have any questions or need further assistance, please don't hesitate to reach out.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Thanks so much for the payment! I really appreciate it.

Let me know if you need anything else!

Best,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

Thank you for your payment. I appreciate your business!

If you need anything, just let me know.

Best,
[Your Name]`;
      }
      break;
      
    case 'check-in':
      if (tone === 'professional') {
        template = `Dear ${client.name},

I wanted to check in regarding the current project. We're currently waiting on some information from your end to proceed.

Could you please provide an update when you have a moment? This will help us move forward efficiently.

Thank you for your attention to this matter.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Just checking in! We're waiting on some info from you to keep things moving.

Could you send that over when you get a chance? Thanks!

Best,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

I wanted to check in - we're waiting on some information from you to proceed.

Could you provide an update when you have a moment?

Thanks,
[Your Name]`;
      }
      break;
      
    case 'payment-reminder':
      const amount = context.overdueInvoices?.[0] 
        ? `${context.overdueInvoices[0].currency} ${context.overdueInvoices[0].total_amount.toFixed(2)}`
        : 'the outstanding amount';
      const invoiceNum = context.overdueInvoices?.[0]?.invoice_number || '[Invoice Number]';
      
      if (tone === 'professional') {
        template = `Dear ${client.name},

I hope this message finds you well. I wanted to follow up regarding invoice ${invoiceNum}, which is now overdue.

The outstanding amount is ${amount}. I would appreciate it if you could process this payment at your earliest convenience.

Please let me know if you have any questions or concerns regarding this invoice.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Hope you're doing well! I wanted to follow up on invoice ${invoiceNum} - it looks like it's overdue.

The amount is ${amount}. Could you take a look when you get a chance? Let me know if you have any questions!

Thanks,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

I wanted to follow up on invoice ${invoiceNum}, which is now overdue.

The outstanding amount is ${amount}. Please process this payment when convenient.

If you have any questions, please let me know.

Best,
[Your Name]`;
      }
      break;
      
    case 'project-update':
      if (tone === 'professional') {
        template = `Dear ${client.name},

I wanted to provide you with an update on [Project Name]. We're making good progress and everything is on track.

I'll keep you informed as we continue to move forward. If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Quick update on [Project Name] - things are going well and we're making good progress!

I'll keep you posted. Let me know if you have any questions!

Best,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

I wanted to update you on [Project Name]. We're making good progress.

I'll keep you informed. If you have any questions, let me know.

Best,
[Your Name]`;
      }
      break;
      
    case 'proposal':
      if (tone === 'professional') {
        template = `Dear ${client.name},

Thank you for your interest in our services. I wanted to reach out to discuss how we might be able to assist you.

I would be happy to schedule a call to discuss your needs and provide a detailed proposal.

Please let me know your availability, and I'll coordinate accordingly.

Best regards,
[Your Name]`;
      } else if (tone === 'friendly') {
        template = `Hi ${client.name.split(' ')[0]},

Thanks for reaching out! I'd love to help you with your project.

Want to schedule a quick call to discuss what you need? I can put together a proposal for you.

Let me know what works for you!

Best,
[Your Name]`;
      } else {
        template = `Hi ${client.name},

Thank you for your interest. I'd like to discuss how I can help you.

Would you be available for a call to discuss your needs? I can provide a detailed proposal.

Best,
[Your Name]`;
      }
      break;
  }
  
  // Replace placeholders
  return replacePlaceholders(template, client, userProfile, context);
}

/**
 * Get top 1-2 email suggestions for a client
 */
export function getClientEmailSuggestions(
  client: Client,
  orders: Order[],
  invoices: Invoice[],
  tasks: Task[],
  userProfile: AppUser | null
): EmailSuggestion[] {
  console.log('[clientEmailService] getClientEmailSuggestions called:', {
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    ordersCount: orders.length,
    invoicesCount: invoices.length,
    tasksCount: tasks.length,
    clientStatus: client.status,
    clientTags: client.tags
  });
  
  // Generate suggestions for all clients, regardless of email
  
  // Analyze context
  const analysis = analyzeClientContext(client, orders, invoices, tasks);
  console.log('[clientEmailService] Context analysis result:', {
    emailTypes: analysis.emailTypes,
    context: analysis.context
  });
  
  // Determine tone
  const tone = determineEmailTone(client);
  console.log('[clientEmailService] Determined tone:', tone);
  
  // Generate suggestions (limit to 1-2)
  const suggestions: EmailSuggestion[] = [];
  const emailTypes = analysis.emailTypes.slice(0, 2); // Top 2 only
  console.log('[clientEmailService] Email types to generate:', emailTypes);
  
  for (const emailType of emailTypes) {
    const email = generateEmailTemplate(
      client,
      emailType,
      tone,
      analysis.context,
      userProfile
    );
    
    // Generate context string
    let contextStr = '';
    switch (emailType) {
      case 'payment-reminder':
        contextStr = `${analysis.context.overdueInvoices?.length || 0} overdue invoice${(analysis.context.overdueInvoices?.length || 0) !== 1 ? 's' : ''}`;
        break;
      case 'follow-up':
        contextStr = `${analysis.context.completedTasks?.length || 0} recent completed task${(analysis.context.completedTasks?.length || 0) !== 1 ? 's' : ''}`;
        break;
      case 're-connect':
        contextStr = `${analysis.context.lastActivityDays || 0} days since last contact`;
        break;
      case 'check-in':
        contextStr = `${analysis.context.waitingOnClientTasks?.length || 0} task${(analysis.context.waitingOnClientTasks?.length || 0) !== 1 ? 's' : ''} waiting on you`;
        break;
      case 'project-update':
        contextStr = `${analysis.context.activeTasks?.length || 0} active project${(analysis.context.activeTasks?.length || 0) !== 1 ? 's' : ''}`;
        break;
      case 'thank-you':
        contextStr = 'Recent payment received';
        break;
      case 'proposal':
        contextStr = 'New opportunity';
        break;
    }
    
    suggestions.push({
      type: emailType,
      context: contextStr,
      email
    });
  }
  
  return suggestions;
}

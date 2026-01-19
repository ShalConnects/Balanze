// =====================================================
// CLIENT MANAGEMENT TYPES
// =====================================================

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string;
  tax_id?: string;
  website?: string;
  source?: string;
  known_since?: string;
  status: 'active' | 'inactive' | 'archived';
  default_currency: string;
  tags: string[];
  notes?: string;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  id?: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string;
  tax_id?: string;
  website?: string;
  source?: string;
  known_since?: string;
  status?: 'active' | 'inactive' | 'archived';
  default_currency?: string;
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, any>;
}

// =====================================================
// ORDER TYPES
// =====================================================

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  order_number: string;
  order_date: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  shipping_address?: string;
  delivery_date?: string;
  tracking_number?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  items?: OrderItem[];
}

export interface OrderInput {
  id?: string;
  user_id?: string;
  client_id: string;
  order_number?: string;
  order_date?: string;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  currency?: string;
  shipping_address?: string;
  delivery_date?: string;
  tracking_number?: string;
  notes?: string;
  metadata?: Record<string, any>;
  items?: OrderItemInput[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total: number;
  product_id?: string;
  sku?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemInput {
  id?: string;
  order_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency?: string;
  tax_rate?: number;
  discount_rate?: number;
  product_id?: string;
  sku?: string;
  notes?: string;
}

// =====================================================
// INVOICE TYPES
// =====================================================

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  order_id?: string;
  transaction_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_status: 'unpaid' | 'partial' | 'paid';
  paid_amount: number;
  paid_date?: string;
  pdf_path?: string;
  last_sent_at?: string;
  email_recipient?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  order?: Order;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceInput {
  id?: string;
  user_id?: string;
  client_id: string;
  order_id?: string;
  transaction_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  currency?: string;
  payment_status?: 'unpaid' | 'partial' | 'paid';
  paid_amount?: number;
  paid_date?: string;
  pdf_path?: string;
  last_sent_at?: string;
  email_recipient?: string;
  notes?: string;
  metadata?: Record<string, any>;
  items?: InvoiceItemInput[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total: number;
  product_id?: string;
  sku?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemInput {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency?: string;
  tax_rate?: number;
  discount_rate?: number;
  product_id?: string;
  sku?: string;
  notes?: string;
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  transaction_id?: string;
  amount: number;
  currency: string;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'other';
  payment_date: string;
  receipt_path?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentInput {
  id?: string;
  user_id?: string;
  invoice_id: string;
  transaction_id?: string;
  amount: number;
  currency?: string;
  payment_method?: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'other';
  payment_date?: string;
  receipt_path?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface ClientAnalytics {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  archived_clients: number;
  total_revenue: number;
  outstanding_invoices: number;
  paid_invoices: number;
  currency_breakdown: Array<{
    currency: string;
    total_revenue: number;
    invoice_count: number;
  }>;
}

export interface InvoiceAnalytics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  draft_count: number;
  sent_count: number;
  paid_count: number;
  overdue_count: number;
  cancelled_count: number;
  currency_breakdown: Array<{
    currency: string;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    invoice_count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

export interface OrderAnalytics {
  total_orders: number;
  total_amount: number;
  pending_count: number;
  processing_count: number;
  completed_count: number;
  cancelled_count: number;
  refunded_count: number;
  currency_breakdown: Array<{
    currency: string;
    total_amount: number;
    order_count: number;
  }>;
  status_breakdown: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
}

// =====================================================
// TASK TYPES (Client Tasks/Orders)
// =====================================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'in_progress' | 'waiting_on_client' | 'waiting_on_me' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_date?: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  client_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  position?: number;
}


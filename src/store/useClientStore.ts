import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { showToast } from '../lib/toast';
import type {
  Client,
  ClientInput,
  Order,
  OrderInput,
  OrderItem,
  OrderItemInput,
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceItemInput,
  Payment,
  PaymentInput,
  ClientAnalytics,
  InvoiceAnalytics,
  OrderAnalytics,
  Task,
  TaskInput
} from '../types/client';

interface ClientStore {
  // State
  clients: Client[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  tasks: Task[];
  loading: boolean;
  tasksLoading: boolean; // Specific loading state for tasks to prevent concurrent calls
  error: string | null;

  // Client Management
  fetchClients: () => Promise<void>;
  addClient: (client: ClientInput) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<ClientInput>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;

  // Order Management
  fetchOrders: (clientId?: string) => Promise<void>;
  addOrder: (order: OrderInput) => Promise<Order | null>;
  updateOrder: (id: string, order: Partial<OrderInput>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  getOrdersByClient: (clientId: string) => Order[];

  // Order Items Management
  addOrderItem: (orderId: string, item: OrderItemInput) => Promise<OrderItem | null>;
  updateOrderItem: (id: string, item: Partial<OrderItemInput>) => Promise<void>;
  deleteOrderItem: (id: string) => Promise<void>;
  calculateOrderTotals: (orderId: string) => Promise<void>;

  // Invoice Management
  fetchInvoices: (clientId?: string) => Promise<void>;
  addInvoice: (invoice: InvoiceInput) => Promise<Invoice | null>;
  updateInvoice: (id: string, invoice: Partial<InvoiceInput>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByClient: (clientId: string) => Invoice[];
  markInvoiceAsSent: (id: string, emailRecipient?: string) => Promise<void>;
  markInvoiceAsPaid: (id: string) => Promise<void>;

  // Invoice Items Management
  addInvoiceItem: (invoiceId: string, item: InvoiceItemInput) => Promise<InvoiceItem | null>;
  updateInvoiceItem: (id: string, item: Partial<InvoiceItemInput>) => Promise<void>;
  deleteInvoiceItem: (id: string) => Promise<void>;
  calculateInvoiceTotals: (invoiceId: string) => Promise<void>;

  // Payment Management
  fetchPayments: (invoiceId?: string) => Promise<void>;
  addPayment: (payment: PaymentInput) => Promise<Payment | null>;
  updatePayment: (id: string, payment: Partial<PaymentInput>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];

  // Task Management
  fetchTasks: (clientId?: string) => Promise<void>;
  addTask: (task: TaskInput) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<TaskInput>) => Promise<void>;
  updateTaskPositions: (updates: Array<{ id: string; position: number }>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  getTasksByClient: (clientId: string) => Task[];

  // Analytics
  getClientAnalytics: () => ClientAnalytics;
  getInvoiceAnalytics: () => InvoiceAnalytics;
  getOrderAnalytics: () => OrderAnalytics;

  // Utility
  clearError: () => void;
}

// Helper function to calculate item totals
function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  taxRate: number = 0,
  discountRate: number = 0
) {
  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total
  };
}

export const useClientStore = create<ClientStore>((set, get) => ({
  // Initial State
  clients: [],
  orders: [],
  invoices: [],
  payments: [],
  tasks: [],
  loading: false,
  tasksLoading: false,
  error: null,

  // Client Management
  fetchClients: async () => {
    // Prevent multiple simultaneous calls
    const state = get();
    if (state.loading) {
      return;
    }
    
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return;
      }

      // Execute query - Supabase handles its own timeouts
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Check for table not found errors
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('Clients table not found. Please run the database migration (create_client_management_schema.sql).');
        }
        throw error;
      }
      set({ clients: data || [], loading: false, error: null });
    } catch (error: any) {
      let errorMessage = 'Failed to fetch clients';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        errorMessage = 'Clients table not found. Please run the database migration (create_client_management_schema.sql).';
      }
      // Set empty array so page can still render, but show error
      set({ clients: [], loading: false, error: errorMessage });
      showToast.error(errorMessage);
    }
  },

  addClient: async (clientInput: ClientInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      const clientData = {
        ...clientInput,
        user_id: user.id,
        status: clientInput.status || 'active',
        default_currency: clientInput.default_currency || 'USD',
        tags: clientInput.tags || [],
        custom_fields: clientInput.custom_fields || {}
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      set((state) => ({
        clients: [data, ...state.clients],
        loading: false
      }));

      showToast.success('Client added successfully');
      return data;
    } catch (error: any) {
      let errorMessage = 'Failed to add client';
      if (error?.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'A client with this information already exists';
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'You do not have permission to add clients';
        } else {
          errorMessage = `Failed to add client: ${error.message}`;
        }
      }
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
      return null;
    }
  },

  updateClient: async (id: string, updates: Partial<ClientInput>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? data : c)),
        loading: false
      }));

      showToast.success('Client updated successfully');
    } catch (error: any) {
      let errorMessage = 'Failed to update client';
      if (error?.message) {
        if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'You do not have permission to update this client';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Client not found. It may have been deleted.';
        } else {
          errorMessage = `Failed to update client: ${error.message}`;
        }
      }
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
    }
  },

  deleteClient: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        loading: false
      }));

      showToast.success('Client deleted successfully');
    } catch (error: any) {
      let errorMessage = 'Failed to delete client';
      if (error?.message) {
        if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'You do not have permission to delete this client';
        } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          errorMessage = 'Cannot delete client: related records exist. Please delete related invoices, orders, or tasks first.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Client not found. It may have already been deleted.';
        } else {
          errorMessage = `Failed to delete client: ${error.message}`;
        }
      }
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
    }
  },

  getClient: (id: string) => {
    return get().clients.find((c) => c.id === id);
  },

  // Order Management
  fetchOrders: async (clientId?: string) => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ orders: [] });
        return;
      }

      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      // Execute query with timeout protection
      const { data, error } = await query;

      if (error) {
        // Silently handle all errors - orders table may not exist
        set({ orders: [] });
        return;
      }

      // Fetch order items
      const orderIds = (data || []).map((o: any) => o.id);
      if (orderIds.length > 0) {
        try {
          const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        const ordersWithItems = (data || []).map((order: any) => ({
          ...order,
          items: (items || []).filter((item: any) => item.order_id === order.id)
        }));

          set({ orders: ordersWithItems });
        } catch (itemsError) {
          // If order items fail, just use orders without items
          set({ orders: data || [] });
        }
      } else {
        set({ orders: data || [] });
      }
    } catch (error: any) {
      // Silently handle all errors - orders are optional
      set({ orders: [] });
    }
  },

  addOrder: async (orderInput: OrderInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      const orderData = {
        ...orderInput,
        user_id: user.id,
        order_date: orderInput.order_date || new Date().toISOString().split('T')[0],
        status: orderInput.status || 'pending',
        currency: orderInput.currency || 'USD',
        subtotal: orderInput.subtotal || 0,
        tax_amount: orderInput.tax_amount || 0,
        discount_amount: orderInput.discount_amount || 0,
        total_amount: orderInput.total_amount || 0,
        metadata: orderInput.metadata || {}
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items if provided
      if (orderInput.items && orderInput.items.length > 0) {
        const items = orderInput.items.map((item) => {
          const totals = calculateItemTotals(
            item.quantity,
            item.unit_price,
            item.tax_rate || 0,
            item.discount_rate || 0
          );

          return {
            order_id: order.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency: item.currency || order.currency,
            subtotal: totals.subtotal,
            tax_rate: item.tax_rate || 0,
            tax_amount: totals.taxAmount,
            discount_rate: item.discount_rate || 0,
            discount_amount: totals.discountAmount,
            total: totals.total,
            product_id: item.product_id,
            sku: item.sku,
            notes: item.notes
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items);

        if (itemsError) throw itemsError;

        // Recalculate order totals
        await get().calculateOrderTotals(order.id);
      }

      // Refresh orders (non-blocking)
      get().fetchOrders().catch(() => {
        // Silently handle errors - orders table may not exist
      });

      showToast.success('Order added successfully');
      return order;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to add order');
      return null;
    }
  },

  updateOrder: async (id: string, updates: Partial<OrderInput>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? data : o)),
        loading: false
      }));

      showToast.success('Order updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update order');
    }
  },

  deleteOrder: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
        loading: false
      }));

      showToast.success('Order deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete order');
    }
  },

  getOrder: (id: string) => {
    return get().orders.find((o) => o.id === id);
  },

  getOrdersByClient: (clientId: string) => {
    return get().orders.filter((o) => o.client_id === clientId);
  },

  // Order Items Management
  addOrderItem: async (orderId: string, item: OrderItemInput) => {
    try {
      set({ loading: true, error: null });
      const totals = calculateItemTotals(
        item.quantity,
        item.unit_price,
        item.tax_rate || 0,
        item.discount_rate || 0
      );

      const order = get().getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const itemData = {
        order_id: orderId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency: item.currency || order.currency,
        subtotal: totals.subtotal,
        tax_rate: item.tax_rate || 0,
        tax_amount: totals.taxAmount,
        discount_rate: item.discount_rate || 0,
        discount_amount: totals.discountAmount,
        total: totals.total,
        product_id: item.product_id,
        sku: item.sku,
        notes: item.notes
      };

      const { data, error } = await supabase
        .from('order_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      // Recalculate order totals
      await get().calculateOrderTotals(orderId);
      await get().fetchOrders();

      showToast.success('Order item added successfully');
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to add order item');
      return null;
    }
  },

  updateOrderItem: async (id: string, updates: Partial<OrderItemInput>) => {
    try {
      set({ loading: true, error: null });
      const existingItem = await supabase
        .from('order_items')
        .select('*')
        .eq('id', id)
        .single();

      if (existingItem.error) throw existingItem.error;

      const item = existingItem.data;
      const quantity = updates.quantity ?? item.quantity;
      const unitPrice = updates.unit_price ?? item.unit_price;
      const taxRate = updates.tax_rate ?? item.tax_rate;
      const discountRate = updates.discount_rate ?? item.discount_rate;

      const totals = calculateItemTotals(quantity, unitPrice, taxRate, discountRate);

      const { data, error } = await supabase
        .from('order_items')
        .update({
          ...updates,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total: totals.total
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Recalculate order totals
      await get().calculateOrderTotals(item.order_id);
      await get().fetchOrders();

      showToast.success('Order item updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update order item');
    }
  },

  deleteOrderItem: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { data: item } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('id', id)
        .single();

      if (!item) throw new Error('Order item not found');

      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recalculate order totals
      await get().calculateOrderTotals(item.order_id);
      await get().fetchOrders();

      showToast.success('Order item deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete order item');
    }
  },

  calculateOrderTotals: async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_order_totals', {
        order_uuid: orderId
      });

      if (error) {
        // Fallback to manual calculation if RPC fails
        const order = get().getOrder(orderId);
        if (order && order.items) {
          const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
          const taxAmount = order.items.reduce((sum, item) => sum + item.tax_amount, 0);
          const discountAmount = order.items.reduce((sum, item) => sum + item.discount_amount, 0);
          const totalAmount = order.items.reduce((sum, item) => sum + item.total, 0);

          await supabase
            .from('orders')
            .update({
              subtotal,
              tax_amount: taxAmount,
              discount_amount: discountAmount,
              total_amount: totalAmount
            })
            .eq('id', orderId);
        }
        return;
      }

      if (data && data.length > 0) {
        const totals = data[0];
        await supabase
          .from('orders')
          .update({
            subtotal: totals.subtotal,
            tax_amount: totals.tax_amount,
            discount_amount: totals.discount_amount,
            total_amount: totals.total_amount
          })
          .eq('id', orderId);
      }
    } catch (error: any) {
      // Silently handle calculation errors - fallback already applied
    }
  },

  // Invoice Management
  fetchInvoices: async (clientId?: string) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return;
      }

      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch invoice items and payments
      const invoiceIds = (data || []).map((i) => i.id);
      if (invoiceIds.length > 0) {
        const [itemsResult, paymentsResult] = await Promise.all([
          supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', invoiceIds),
          supabase
            .from('payments')
            .select('*')
            .in('invoice_id', invoiceIds)
        ]);

        const invoicesWithData = (data || []).map((invoice) => ({
          ...invoice,
          items: (itemsResult.data || []).filter((item) => item.invoice_id === invoice.id),
          payments: (paymentsResult.data || []).filter((p) => p.invoice_id === invoice.id)
        }));

        set({ invoices: invoicesWithData, loading: false });
      } else {
        set({ invoices: data || [], loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch invoices');
    }
  },

  addInvoice: async (invoiceInput: InvoiceInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      // Validation
      if (!invoiceInput.client_id) {
        set({ loading: false, error: 'Client is required' });
        showToast.error('Client is required');
        return null;
      }

      if (!invoiceInput.due_date) {
        set({ loading: false, error: 'Due date is required' });
        showToast.error('Due date is required');
        return null;
      }

      const invoiceDate = invoiceInput.invoice_date || new Date().toISOString().split('T')[0];
      const dueDate = invoiceInput.due_date;

      // Validate date: due_date should not be before invoice_date
      if (new Date(dueDate) < new Date(invoiceDate)) {
        set({ loading: false, error: 'Due date cannot be before invoice date' });
        showToast.error('Due date cannot be before invoice date');
        return null;
      }

      // Validate amounts: ensure no negative values
      const subtotal = invoiceInput.subtotal || 0;
      const taxAmount = invoiceInput.tax_amount || 0;
      const discountAmount = invoiceInput.discount_amount || 0;
      const totalAmount = invoiceInput.total_amount || 0;
      const paidAmount = invoiceInput.paid_amount || 0;

      if (subtotal < 0 || taxAmount < 0 || discountAmount < 0 || totalAmount < 0 || paidAmount < 0) {
        set({ loading: false, error: 'Amounts cannot be negative' });
        showToast.error('Amounts cannot be negative');
        return null;
      }

      // Validate invoice items if provided
      if (invoiceInput.items && invoiceInput.items.length > 0) {
        for (const item of invoiceInput.items) {
          if (item.quantity <= 0) {
            set({ loading: false, error: 'Item quantity must be greater than 0' });
            showToast.error('Item quantity must be greater than 0');
            return null;
          }
          if (item.unit_price < 0) {
            set({ loading: false, error: 'Item unit price cannot be negative' });
            showToast.error('Item unit price cannot be negative');
            return null;
          }
          if (item.tax_rate && (item.tax_rate < 0 || item.tax_rate > 100)) {
            set({ loading: false, error: 'Tax rate must be between 0 and 100' });
            showToast.error('Tax rate must be between 0 and 100');
            return null;
          }
          if (item.discount_rate && (item.discount_rate < 0 || item.discount_rate > 100)) {
            set({ loading: false, error: 'Discount rate must be between 0 and 100' });
            showToast.error('Discount rate must be between 0 and 100');
            return null;
          }
        }
      }

      const invoiceData = {
        ...invoiceInput,
        user_id: user.id,
        invoice_date: invoiceDate,
        status: invoiceInput.status || 'draft',
        currency: invoiceInput.currency || 'USD',
        payment_status: invoiceInput.payment_status || 'unpaid',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        metadata: invoiceInput.metadata || {}
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Add invoice items if provided
      if (invoiceInput.items && invoiceInput.items.length > 0) {
        const items = invoiceInput.items.map((item) => {
          const totals = calculateItemTotals(
            item.quantity,
            item.unit_price,
            item.tax_rate || 0,
            item.discount_rate || 0
          );

          return {
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency: item.currency || invoice.currency,
            subtotal: totals.subtotal,
            tax_rate: item.tax_rate || 0,
            tax_amount: totals.taxAmount,
            discount_rate: item.discount_rate || 0,
            discount_amount: totals.discountAmount,
            total: totals.total,
            product_id: item.product_id,
            sku: item.sku,
            notes: item.notes
          };
        });

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;

        // Recalculate invoice totals
        await get().calculateInvoiceTotals(invoice.id);
      }

      // Refresh invoices
      await get().fetchInvoices();

      showToast.success('Invoice created successfully');
      return invoice;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to create invoice');
      return null;
    }
  },

  updateInvoice: async (id: string, updates: Partial<InvoiceInput>) => {
    try {
      set({ loading: true, error: null });

      // Validation for date updates
      if (updates.invoice_date && updates.due_date) {
        if (new Date(updates.due_date) < new Date(updates.invoice_date)) {
          set({ loading: false, error: 'Due date cannot be before invoice date' });
          showToast.error('Due date cannot be before invoice date');
          return;
        }
      } else if (updates.due_date) {
        // If only due_date is updated, check against existing invoice_date
        const existingInvoice = get().getInvoice(id);
        if (existingInvoice && new Date(updates.due_date) < new Date(existingInvoice.invoice_date)) {
          set({ loading: false, error: 'Due date cannot be before invoice date' });
          showToast.error('Due date cannot be before invoice date');
          return;
        }
      }

      // Validate amounts: ensure no negative values
      if (updates.subtotal !== undefined && updates.subtotal < 0) {
        set({ loading: false, error: 'Subtotal cannot be negative' });
        showToast.error('Subtotal cannot be negative');
        return;
      }
      if (updates.tax_amount !== undefined && updates.tax_amount < 0) {
        set({ loading: false, error: 'Tax amount cannot be negative' });
        showToast.error('Tax amount cannot be negative');
        return;
      }
      if (updates.discount_amount !== undefined && updates.discount_amount < 0) {
        set({ loading: false, error: 'Discount amount cannot be negative' });
        showToast.error('Discount amount cannot be negative');
        return;
      }
      if (updates.total_amount !== undefined && updates.total_amount < 0) {
        set({ loading: false, error: 'Total amount cannot be negative' });
        showToast.error('Total amount cannot be negative');
        return;
      }
      if (updates.paid_amount !== undefined && updates.paid_amount < 0) {
        set({ loading: false, error: 'Paid amount cannot be negative' });
        showToast.error('Paid amount cannot be negative');
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.map((i) => (i.id === id ? data : i)),
        loading: false
      }));

      showToast.success('Invoice updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update invoice');
    }
  },

  deleteInvoice: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== id),
        loading: false
      }));

      showToast.success('Invoice deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete invoice');
    }
  },

  getInvoice: (id: string) => {
    return get().invoices.find((i) => i.id === id);
  },

  getInvoicesByClient: (clientId: string) => {
    return get().invoices.filter((i) => i.client_id === clientId);
  },

  markInvoiceAsSent: async (id: string, emailRecipient?: string) => {
    try {
      await get().updateInvoice(id, {
        status: 'sent',
        last_sent_at: new Date().toISOString(),
        email_recipient: emailRecipient
      });
    } catch (error: any) {
      set({ error: error.message });
      showToast.error('Failed to mark invoice as sent');
    }
  },

  markInvoiceAsPaid: async (id: string) => {
    try {
      await get().updateInvoice(id, {
        status: 'paid',
        payment_status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      set({ error: error.message });
      showToast.error('Failed to mark invoice as paid');
    }
  },

  // Invoice Items Management
  addInvoiceItem: async (invoiceId: string, item: InvoiceItemInput) => {
    try {
      set({ loading: true, error: null });
      const totals = calculateItemTotals(
        item.quantity,
        item.unit_price,
        item.tax_rate || 0,
        item.discount_rate || 0
      );

      const invoice = get().getInvoice(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const itemData = {
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency: item.currency || invoice.currency,
        subtotal: totals.subtotal,
        tax_rate: item.tax_rate || 0,
        tax_amount: totals.taxAmount,
        discount_rate: item.discount_rate || 0,
        discount_amount: totals.discountAmount,
        total: totals.total,
        product_id: item.product_id,
        sku: item.sku,
        notes: item.notes
      };

      const { data, error } = await supabase
        .from('invoice_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      // Recalculate invoice totals
      await get().calculateInvoiceTotals(invoiceId);
      await get().fetchInvoices();

      showToast.success('Invoice item added successfully');
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to add invoice item');
      return null;
    }
  },

  updateInvoiceItem: async (id: string, updates: Partial<InvoiceItemInput>) => {
    try {
      set({ loading: true, error: null });
      const existingItem = await supabase
        .from('invoice_items')
        .select('*')
        .eq('id', id)
        .single();

      if (existingItem.error) throw existingItem.error;

      const item = existingItem.data;
      const quantity = updates.quantity ?? item.quantity;
      const unitPrice = updates.unit_price ?? item.unit_price;
      const taxRate = updates.tax_rate ?? item.tax_rate;
      const discountRate = updates.discount_rate ?? item.discount_rate;

      const totals = calculateItemTotals(quantity, unitPrice, taxRate, discountRate);

      const { data, error } = await supabase
        .from('invoice_items')
        .update({
          ...updates,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total: totals.total
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Recalculate invoice totals
      await get().calculateInvoiceTotals(item.invoice_id);
      await get().fetchInvoices();

      showToast.success('Invoice item updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update invoice item');
    }
  },

  deleteInvoiceItem: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { data: item } = await supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('id', id)
        .single();

      if (!item) throw new Error('Invoice item not found');

      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recalculate invoice totals
      await get().calculateInvoiceTotals(item.invoice_id);
      await get().fetchInvoices();

      showToast.success('Invoice item deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete invoice item');
    }
  },

  calculateInvoiceTotals: async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_invoice_totals', {
        invoice_uuid: invoiceId
      });

      if (error) {
        // Fallback to manual calculation if RPC fails
        const invoice = get().getInvoice(invoiceId);
        if (invoice && invoice.items) {
          const subtotal = invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
          const taxAmount = invoice.items.reduce((sum, item) => sum + item.tax_amount, 0);
          const discountAmount = invoice.items.reduce((sum, item) => sum + item.discount_amount, 0);
          const totalAmount = invoice.items.reduce((sum, item) => sum + item.total, 0);

          await supabase
            .from('invoices')
            .update({
              subtotal,
              tax_amount: taxAmount,
              discount_amount: discountAmount,
              total_amount: totalAmount
            })
            .eq('id', invoiceId);
        }
        return;
      }

      if (data && data.length > 0) {
        const totals = data[0];
        await supabase
          .from('invoices')
          .update({
            subtotal: totals.subtotal,
            tax_amount: totals.tax_amount,
            discount_amount: totals.discount_amount,
            total_amount: totals.total_amount
          })
          .eq('id', invoiceId);
      }
    } catch (error: any) {
      // Silently handle calculation errors - fallback already applied
    }
  },

  // Payment Management
  fetchPayments: async (invoiceId?: string) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return;
      }

      let query = supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ payments: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch payments');
    }
  },

  addPayment: async (paymentInput: PaymentInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      const paymentData = {
        ...paymentInput,
        user_id: user.id,
        payment_date: paymentInput.payment_date || new Date().toISOString().split('T')[0],
        currency: paymentInput.currency || 'USD',
        payment_method: paymentInput.payment_method || 'other',
        metadata: paymentInput.metadata || {}
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      // Update invoice payment status (trigger should handle this, but refresh to be sure)
      await get().fetchInvoices();
      await get().fetchPayments();

      showToast.success('Payment added successfully');
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to add payment');
      return null;
    }
  },

  updatePayment: async (id: string, updates: Partial<PaymentInput>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        payments: state.payments.map((p) => (p.id === id ? data : p)),
        loading: false
      }));

      // Refresh invoices to update payment status
      await get().fetchInvoices();

      showToast.success('Payment updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update payment');
    }
  },

  deletePayment: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        payments: state.payments.filter((p) => p.id !== id),
        loading: false
      }));

      // Refresh invoices to update payment status
      await get().fetchInvoices();

      showToast.success('Payment deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete payment');
    }
  },

  getPaymentsByInvoice: (invoiceId: string) => {
    return get().payments.filter((p) => p.invoice_id === invoiceId);
  },

  // Analytics
  getClientAnalytics: () => {
    const { clients, invoices } = get();
    const activeClients = clients.filter((c) => c.status === 'active').length;
    const inactiveClients = clients.filter((c) => c.status === 'inactive').length;
    const archivedClients = clients.filter((c) => c.status === 'archived').length;

    const totalRevenue = invoices
      .filter((i) => i.payment_status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);

    const outstandingInvoices = invoices
      .filter((i) => i.payment_status !== 'paid')
      .length;

    const paidInvoices = invoices.filter((i) => i.payment_status === 'paid').length;

    // Currency breakdown
    const currencyMap = new Map<string, { total_revenue: number; invoice_count: number }>();
    invoices
      .filter((i) => i.payment_status === 'paid')
      .forEach((invoice) => {
        const existing = currencyMap.get(invoice.currency) || { total_revenue: 0, invoice_count: 0 };
        currencyMap.set(invoice.currency, {
          total_revenue: existing.total_revenue + invoice.total_amount,
          invoice_count: existing.invoice_count + 1
        });
      });

    return {
      total_clients: clients.length,
      active_clients: activeClients,
      inactive_clients: inactiveClients,
      archived_clients: archivedClients,
      total_revenue: totalRevenue,
      outstanding_invoices: outstandingInvoices,
      paid_invoices: paidInvoices,
      currency_breakdown: Array.from(currencyMap.entries()).map(([currency, data]) => ({
        currency,
        ...data
      }))
    };
  },

  getInvoiceAnalytics: () => {
    const { invoices } = get();
    const totalAmount = invoices.reduce((sum, i) => sum + i.total_amount, 0);
    const paidAmount = invoices
      .filter((i) => i.payment_status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);
    const outstandingAmount = totalAmount - paidAmount;

    const statusCounts = {
      draft: invoices.filter((i) => i.status === 'draft').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      cancelled: invoices.filter((i) => i.status === 'cancelled').length
    };

    // Currency breakdown
    const currencyMap = new Map<string, { total_amount: number; paid_amount: number; outstanding_amount: number; invoice_count: number }>();
    invoices.forEach((invoice) => {
      const existing = currencyMap.get(invoice.currency) || {
        total_amount: 0,
        paid_amount: 0,
        outstanding_amount: 0,
        invoice_count: 0
      };
      currencyMap.set(invoice.currency, {
        total_amount: existing.total_amount + invoice.total_amount,
        paid_amount: existing.paid_amount + (invoice.payment_status === 'paid' ? invoice.total_amount : 0),
        outstanding_amount: existing.outstanding_amount + (invoice.payment_status !== 'paid' ? invoice.total_amount : 0),
        invoice_count: existing.invoice_count + 1
      });
    });

    // Status breakdown
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      total_amount: invoices.filter((i) => i.status === status).reduce((sum, i) => sum + i.total_amount, 0)
    }));

    return {
      total_invoices: invoices.length,
      total_amount,
      paid_amount,
      outstanding_amount,
      draft_count: statusCounts.draft,
      sent_count: statusCounts.sent,
      paid_count: statusCounts.paid,
      overdue_count: statusCounts.overdue,
      cancelled_count: statusCounts.cancelled,
      currency_breakdown: Array.from(currencyMap.entries()).map(([currency, data]) => ({
        currency,
        ...data
      })),
      status_breakdown: statusBreakdown
    };
  },

  getOrderAnalytics: () => {
    const { orders } = get();
    const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);

    const statusCounts = {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      refunded: orders.filter((o) => o.status === 'refunded').length
    };

    // Currency breakdown
    const currencyMap = new Map<string, { total_amount: number; order_count: number }>();
    orders.forEach((order) => {
      const existing = currencyMap.get(order.currency) || { total_amount: 0, order_count: 0 };
      currencyMap.set(order.currency, {
        total_amount: existing.total_amount + order.total_amount,
        order_count: existing.order_count + 1
      });
    });

    // Status breakdown
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      total_amount: orders.filter((o) => o.status === status).reduce((sum, o) => sum + o.total_amount, 0)
    }));

    return {
      total_orders: orders.length,
      total_amount,
      pending_count: statusCounts.pending,
      processing_count: statusCounts.processing,
      completed_count: statusCounts.completed,
      cancelled_count: statusCounts.cancelled,
      refunded_count: statusCounts.refunded,
      currency_breakdown: Array.from(currencyMap.entries()).map(([currency, data]) => ({
        currency,
        ...data
      })),
      status_breakdown: statusBreakdown
    };
  },

  // Task Management
  fetchTasks: async (clientId?: string) => {
    const state = get();
    // Prevent concurrent calls - if already loading tasks, skip
    if (state.tasksLoading) {
      return;
    }

    try {
      set({ tasksLoading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ tasksLoading: false, error: 'Not authenticated' });
        return;
      }

      let query = supabase
        .from('client_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('status', { ascending: true })
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      // Add timeout to prevent hanging - 8 seconds should be enough for most queries
      const queryPromise = query;
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout: Client tasks fetch took too long (8s). Please check your connection.')), 8000)
      );
      
      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as { data: any; error: any };

      if (error) {
        // Check for table not found errors
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('Client tasks table not found. Please run the database migration (create_client_tasks_table.sql).');
        }
        // Check for timeout errors
        if (error.message?.includes('timeout')) {
          throw error;
        }
        throw error;
      }

      set({ tasks: data || [], tasksLoading: false, error: null });
    } catch (error: any) {
      let errorMessage = 'Failed to fetch client tasks';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'PGRST116' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        errorMessage = 'Client tasks table not found. Please run the database migration (create_client_tasks_table.sql).';
      }
      set({ error: errorMessage, tasksLoading: false });
      // Only show toast for actual errors, not for skipped concurrent calls
      if (errorMessage !== 'Failed to fetch client tasks') {
        showToast.error(errorMessage);
      }
    }
  },

  addTask: async (taskInput: TaskInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      // Get max position for the status to add new task at the end
      const status = taskInput.status || 'in_progress';
      const existingTasksWithStatus = get().tasks.filter(t => t.status === status);
      const maxPosition = existingTasksWithStatus.length > 0
        ? Math.max(...existingTasksWithStatus.map(t => t.position || 0))
        : 0;

      const taskData = {
        ...taskInput,
        user_id: user.id,
        priority: taskInput.priority || 'medium',
        status: status,
        position: taskInput.position ?? (maxPosition + 1)
      };

      const { data, error } = await supabase
        .from('client_tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: [data, ...state.tasks],
        loading: false
      }));

      showToast.success('Task created successfully');
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to create task');
      return null;
    }
  },

  updateTask: async (id: string, updates: Partial<TaskInput>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('client_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? data : t)),
        loading: false
      }));

      showToast.success('Task updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update task');
    }
  },

  updateTaskPositions: async (updates: Array<{ id: string; position: number }>) => {
    try {
      // Optimistically update local state
      set((state) => ({
        tasks: state.tasks.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update ? { ...t, position: update.position } : t;
        })
      }));

      // Batch update positions in database
      const updatePromises = updates.map(({ id, position }) =>
        supabase
          .from('client_tasks')
          .update({ position })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      const hasError = results.some(({ error }) => error);

      if (hasError) {
        // On error, refresh tasks to get correct state
        const { fetchTasks } = get();
        await fetchTasks();
        throw new Error('Failed to update task positions');
      }
    } catch (error: any) {
      // Refresh tasks on error to ensure consistency
      const { fetchTasks } = get();
      await fetchTasks();
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('client_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        loading: false
      }));

      showToast.success('Task deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete task');
    }
  },

  getTask: (id: string) => {
    return get().tasks.find((t) => t.id === id);
  },

  getTasksByClient: (clientId: string) => {
    return get().tasks.filter((t) => t.client_id === clientId);
  },

  // Utility
  clearError: () => set({ error: null })
}));


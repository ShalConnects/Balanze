import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2, Calculator, Edit2 } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Order, OrderInput, OrderItemInput } from '../../types/client';
import { Loader } from '../common/Loader';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  clientId?: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({ isOpen, onClose, order, clientId }) => {
  const {
    clients,
    fetchClients,
    addOrder,
    updateOrder,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
    calculateOrderTotals,
    loading
  } = useClientStore();

  const { isMobile } = useMobileDetection();
  const [formData, setFormData] = useState<OrderInput>({
    client_id: clientId || '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    currency: 'USD',
    shipping_address: '',
    delivery_date: '',
    tracking_number: '',
    notes: '',
    items: []
  });

  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<OrderItemInput>({
    description: '',
    quantity: 1,
    unit_price: 0,
    currency: 'USD',
    tax_rate: 0,
    discount_rate: 0,
    product_id: '',
    sku: '',
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (order) {
      setFormData({
        client_id: order.client_id,
        order_date: order.order_date,
        status: order.status,
        currency: order.currency,
        shipping_address: order.shipping_address || '',
        delivery_date: order.delivery_date || '',
        tracking_number: order.tracking_number || '',
        notes: order.notes || ''
      });
      if (order.items) {
        setOrderItems(order.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency: item.currency,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate,
          product_id: item.product_id,
          sku: item.sku,
          notes: item.notes
        })));
      }
    } else {
      setFormData({
        client_id: clientId || '',
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        currency: 'USD',
        shipping_address: '',
        delivery_date: '',
        tracking_number: '',
        notes: '',
        items: []
      });
      setOrderItems([]);
    }
    setEditingItemIndex(null);
    setItemForm({
      description: '',
      quantity: 1,
      unit_price: 0,
      currency: formData.currency || 'USD',
      tax_rate: 0,
      discount_rate: 0,
      product_id: '',
      sku: '',
      notes: ''
    });
  }, [order, clientId, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_price' || name === 'tax_rate' || name === 'discount_rate'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const calculateItemTotal = (item: OrderItemInput) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = subtotal * (item.discount_rate / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.tax_rate / 100);
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: afterDiscount + taxAmount
    };
  };

  const handleAddItem = () => {
    if (!itemForm.description.trim()) return;

    const newItem: OrderItemInput = {
      ...itemForm,
      currency: formData.currency || 'USD'
    };

    if (editingItemIndex !== null) {
      const updated = [...orderItems];
      updated[editingItemIndex] = newItem;
      setOrderItems(updated);
      setEditingItemIndex(null);
    } else {
      setOrderItems([...orderItems, newItem]);
    }

    setItemForm({
      description: '',
      quantity: 1,
      unit_price: 0,
      currency: formData.currency || 'USD',
      tax_rate: 0,
      discount_rate: 0,
      product_id: '',
      sku: '',
      notes: ''
    });
  };

  const handleEditItem = (index: number) => {
    setItemForm(orderItems[index]);
    setEditingItemIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setItemForm({
        description: '',
        quantity: 1,
        unit_price: 0,
        currency: formData.currency || 'USD',
        tax_rate: 0,
        discount_rate: 0,
        product_id: '',
        sku: '',
        notes: ''
      });
    }
  };

  const calculateTotals = () => {
    const totals = orderItems.reduce(
      (acc, item) => {
        const itemTotal = calculateItemTotal(item);
        return {
          subtotal: acc.subtotal + itemTotal.subtotal,
          taxAmount: acc.taxAmount + itemTotal.taxAmount,
          discountAmount: acc.discountAmount + itemTotal.discountAmount,
          total: acc.total + itemTotal.total
        };
      },
      { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 }
    );
    return totals;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      return;
    }

    if (orderItems.length === 0) {
      return;
    }

    try {
      const totals = calculateTotals();
      const orderData: OrderInput = {
        ...formData,
        items: orderItems,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        total_amount: totals.total
      };

      if (order) {
        await updateOrder(order.id, orderData);
      } else {
        await addOrder(orderData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();
  const selectedClient = clients.find((c) => c.id === formData.client_id);

  return (
    <>
      <Loader isLoading={loading} message={order ? 'Updating order...' : 'Creating order...'} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={loading ? undefined : onClose}
        />
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all ${isMobile ? 'pb-32' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {order ? 'Edit Order' : 'Create New Order'}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Close form"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    required
                    disabled={!!clientId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Select a client</option>
                    {clients
                      .filter((c) => c.status === 'active')
                      .map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company_name ? `(${client.company_name})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="order_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="order_date"
                    name="order_date"
                    value={formData.order_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="BDT">BDT</option>
                    <option value="INR">INR</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shipping Address
                </label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Shipping address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    id="tracking_number"
                    name="tracking_number"
                    value={formData.tracking_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tracking number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Order notes"
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Items</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Add/Edit Item Form */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={itemForm.description}
                      onChange={handleItemChange}
                      name="description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Item description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={itemForm.quantity}
                      onChange={handleItemChange}
                      name="quantity"
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={itemForm.unit_price}
                      onChange={handleItemChange}
                      name="unit_price"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={itemForm.tax_rate}
                      onChange={handleItemChange}
                      name="tax_rate"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      value={itemForm.discount_rate}
                      onChange={handleItemChange}
                      name="discount_rate"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={itemForm.sku}
                      onChange={handleItemChange}
                      name="sku"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SKU"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!itemForm.description.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingItemIndex !== null ? (
                      <>
                        <Save className="w-4 h-4" />
                        Update Item
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Item
                      </>
                    )}
                  </button>
                  {editingItemIndex !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setItemForm({
                          description: '',
                          quantity: 1,
                          unit_price: 0,
                          currency: formData.currency || 'USD',
                          tax_rate: 0,
                          discount_rate: 0,
                          product_id: '',
                          sku: '',
                          notes: ''
                        });
                      }}
                      className="ml-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              {orderItems.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Price</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Tax</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Discount</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Total</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orderItems.map((item, index) => {
                        const itemTotal = calculateItemTotal(item);
                        return (
                          <tr key={index} className={editingItemIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                              {formData.currency} {item.unit_price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">{item.tax_rate}%</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">{item.discount_rate}%</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                              {formData.currency} {itemTotal.total.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditItem(index)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(index)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order Totals */}
              {orderItems.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formData.currency} {totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-white">
                      -{formData.currency} {totals.discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.currency} {totals.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.currency} {totals.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.client_id || orderItems.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {order ? 'Update Order' : 'Create Order'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};


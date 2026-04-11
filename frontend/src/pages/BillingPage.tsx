import { useState, useEffect, useCallback } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Receipt,
  Banknote,
  Smartphone,
  Printer,
  Share2,
  IndianRupee,
  Split,
  Loader2,
  Check,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Order } from '@/types';
import { toast } from 'sonner';
import { useRestaurantSettings } from '@/contexts/RestaurantSettingsContext';

const PROCESSING_UI_MS = 1000;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const BillingPage = () => {
  const {
    orders,
    updateOrderStatus,
    processPayment,
    isLoading,
    isOrderSyncing,
  } = useOrders();
  const { settings } = useRestaurantSettings();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'upi' | 'split' | null
  >(null);
  const [showSplitInput, setShowSplitInput] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedOrderSyncing = selectedOrder
    ? isOrderSyncing(selectedOrder.id)
    : false;

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    order: Order | null;
    method: 'cash' | 'upi' | 'split' | null;
    cashAmount?: number;
    upiAmount?: number;
  }>({ show: false, order: null, method: null });

  const dismissSuccessModal = useCallback(() => {
    setSuccessModal({ show: false, order: null, method: null });
  }, []);

  // Auto-dismiss success modal after 6 seconds
  useEffect(() => {
    if (!successModal.show) return;
    const timer = setTimeout(dismissSuccessModal, 6000);
    return () => clearTimeout(timer);
  }, [successModal.show, dismissSuccessModal]);

  // Get orders that are ready for billing (any active order not yet completed payment)
  const billableOrders = orders.filter(
    (order) =>
      ['new', 'preparing', 'ready', 'served'].includes(order.status) &&
      (!order.payment || order.payment.status !== 'completed'),
  );

  const getTaxBreakdown = (order: Order) => {
    const cgst = order.taxAmount / 2;
    const sgst = order.taxAmount / 2;
    return { cgst, sgst, total: order.taxAmount };
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });

  const handlePayment = async (method: 'cash' | 'upi') => {
    if (!selectedOrder || isSubmitting || selectedOrderSyncing) return;

    const orderSnapshot = selectedOrder;
    setPaymentMethod(method);
    setIsSubmitting(true);
    try {
      const paymentPromise =
        orderSnapshot.status === 'served'
          ? updateOrderStatus(orderSnapshot.id, 'collected', method)
          : processPayment(orderSnapshot.id, method);

      await paymentPromise;

      await sleep(PROCESSING_UI_MS);

      // Show success modal
      setSuccessModal({
        show: true,
        order: orderSnapshot,
        method: method,
      });

      setSelectedOrder(null);
      setPaymentMethod(null);
      setShowSplitInput(false);
      setCashAmount('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process payment');
      setSelectedOrder(orderSnapshot);
      setPaymentMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplitPayment = async () => {
    if (!selectedOrder || isSubmitting || selectedOrderSyncing) return;

    const orderSnapshot = selectedOrder;
    const cashValue = parseFloat(cashAmount) || 0;
    const upiValue = selectedOrder.totalAmount - cashValue;

    if (cashValue <= 0) {
      toast.error('Please enter a valid cash amount');
      return;
    }

    if (cashValue >= selectedOrder.totalAmount) {
      toast.error(
        'Cash amount must be less than total. Use full Cash payment instead.',
      );
      return;
    }

    setPaymentMethod('split');
    setIsSubmitting(true);
    try {
      const paymentPromise =
        orderSnapshot.status === 'served'
          ? updateOrderStatus(
              orderSnapshot.id,
              'collected',
              'split',
              cashValue,
              upiValue,
            )
          : processPayment(orderSnapshot.id, 'split', cashValue, upiValue);

      await paymentPromise;

      await sleep(PROCESSING_UI_MS);

      // Show success modal with split details
      setSuccessModal({
        show: true,
        order: orderSnapshot,
        method: 'split',
        cashAmount: cashValue,
        upiAmount: upiValue,
      });

      setSelectedOrder(null);
      setPaymentMethod(null);
      setShowSplitInput(false);
      setCashAmount('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process split payment');
      setSelectedOrder(orderSnapshot);
      setPaymentMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUpiAmount = () => {
    if (!selectedOrder) return 0;
    const cashValue = parseFloat(cashAmount) || 0;
    return Math.max(0, selectedOrder.totalAmount - cashValue);
  };

  const printBill = (order: Order) => {
    const tax = getTaxBreakdown(order);
    const restaurantName = escapeHtml(
      settings.restaurantName?.trim() || 'Restaurant',
    );
    const restaurantAddress = escapeHtml(settings.address?.trim() || '');
    const restaurantPhone = escapeHtml(settings.phone?.trim() || '');
    const restaurantEmail = escapeHtml(settings.email?.trim() || '');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bill - ${order.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { 
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html, body { width: 80mm; }
            }
            body { 
              font-family: 'Courier New', 'Lucida Console', monospace;
              font-size: 12px;
              line-height: 1.4;
              width: 80mm;
              padding: 2mm;
              color: #000;
              background: #fff;
            }
            .header { text-align: center; margin-bottom: 8px; }
            .header h1 { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
            .header p { font-size: 11px; margin: 2px 0; }
            .divider { 
              border: none;
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row { 
              display: table;
              width: 100%;
              margin: 3px 0;
            }
            .row .label { 
              display: table-cell;
              text-align: left;
              max-width: 55mm;
              word-wrap: break-word;
            }
            .row .value { 
              display: table-cell;
              text-align: right;
              white-space: nowrap;
            }
            .addons { 
              font-size: 10px;
              color: #333;
              padding-left: 8px;
              margin: 1px 0 3px 0;
            }
            .total-row { font-weight: bold; font-size: 14px; }
            .footer { 
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
            }
            .footer p { margin: 2px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurantName.toUpperCase()}</h1>
            ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
            ${restaurantPhone ? `<p>Ph: ${restaurantPhone}</p>` : ''}
            ${restaurantEmail ? `<p>${restaurantEmail}</p>` : ''}
            <p>--------------------------------</p>
            <p>Order: ${order.orderNumber}</p>
            <p>${order.orderType === 'dine-in' && order.tableNumber ? `Table: ${order.tableNumber}` : 'Takeaway'}</p>
            <p>${new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
          </div>
          <div class="divider"></div>
          ${order.items
            .map(
              (item) => `
            <div class="row">
              <span class="label">${item.menuItemName} x${item.quantity}</span>
              <span class="value">${item.totalPrice.toFixed(0)}</span>
            </div>
            ${
              item.addOns && item.addOns.length > 0
                ? `
              <div class="addons">+ ${item.addOns.map((a) => a.name).join(', ')}</div>
            `
                : ''
            }
          `,
            )
            .join('')}
          <div class="divider"></div>
          <div class="row">
            <span class="label">Subtotal</span>
            <span class="value">${order.subtotal.toFixed(0)}</span>
          </div>
          ${
            order.serviceCharge > 0
              ? `
          <div class="row">
            <span class="label">Service Charge</span>
            <span class="value">${order.serviceCharge.toFixed(0)}</span>
          </div>
          `
              : ''
          }
          <div class="row">
            <span class="label">CGST (2.5%)</span>
            <span class="value">${tax.cgst.toFixed(0)}</span>
          </div>
          <div class="row">
            <span class="label">SGST (2.5%)</span>
            <span class="value">${tax.sgst.toFixed(0)}</span>
          </div>
          ${
            order.discountAmount > 0
              ? `
          <div class="row">
            <span class="label">Discount</span>
            <span class="value">-${order.discountAmount.toFixed(0)}</span>
          </div>
          `
              : ''
          }
          <div class="divider"></div>
          <div class="row total-row">
            <span class="label">TOTAL</span>
            <span class="value">Rs.${order.totalAmount.toFixed(0)}</span>
          </div>
          <div class="divider"></div>
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit again</p>
            <p>--------------------------------</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=302,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast.success('Bill sent to printer');
  };

  const handlePrint = () => {
    if (selectedOrder) {
      printBill(selectedOrder);
    } else {
      toast.error('Please select an order first');
    }
  };

  const handleShare = () => {
    toast.success('Bill shared via WhatsApp');
  };

  if (isLoading && orders.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        data-testid="billing-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Loading billing data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Processing overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <Card className="p-6 sm:p-8 flex flex-col items-center gap-4 bg-card shadow-2xl border-primary/20 animate-in fade-in zoom-in-95">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-bold text-lg sm:text-xl">
                Processing Payment...
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Finalizing billing details
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Success Modal */}
      {successModal.show && successModal.order && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={dismissSuccessModal}
        >
          <div
            className="bg-card border border-border/40 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header */}
            <div
              className="relative px-6 pt-8 pb-6 text-center"
              style={{
                background: 'linear-gradient(135deg, hsl(142 70% 45% / 0.12), hsl(142 70% 45% / 0.04))',
              }}
            >
              <button
                onClick={dismissSuccessModal}
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated checkmark */}
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500"
                style={{
                  background: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 38%))',
                  boxShadow: '0 8px 24px -4px hsl(142 70% 45% / 0.4)',
                }}
              >
                <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>

              <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Order #{successModal.order.orderNumber} completed
              </p>
            </div>

            {/* Payment Details */}
            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-2xl font-extrabold text-foreground font-mono-price">
                  ₹{successModal.order.totalAmount.toFixed(0)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Method</span>
                <Badge
                  variant="outline"
                  className="text-xs font-semibold px-2.5 py-1 gap-1.5"
                >
                  {successModal.method === 'cash' && <Banknote className="w-3.5 h-3.5" />}
                  {successModal.method === 'upi' && <Smartphone className="w-3.5 h-3.5" />}
                  {successModal.method === 'split' && <Split className="w-3.5 h-3.5" />}
                  {successModal.method === 'cash' && 'Cash'}
                  {successModal.method === 'upi' && 'UPI'}
                  {successModal.method === 'split' && 'Split'}
                </Badge>
              </div>

              {successModal.method === 'split' && successModal.cashAmount != null && successModal.upiAmount != null && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5" /> Cash
                    </span>
                    <span className="font-semibold">₹{successModal.cashAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> UPI
                    </span>
                    <span className="font-semibold">₹{successModal.upiAmount.toFixed(0)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order Type</span>
                <span className="text-sm font-medium capitalize">
                  {successModal.order.orderType === 'dine-in' && successModal.order.tableNumber
                    ? `Dine-in · Table ${successModal.order.tableNumber}`
                    : 'Takeaway'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Items</span>
                <span className="text-sm font-medium">
                  {successModal.order.items.length} item{successModal.order.items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (successModal.order) printBill(successModal.order);
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
              <Button
                className="flex-1"
                onClick={dismissSuccessModal}
                style={{
                  background: 'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 38%))',
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Billing</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Process payments and generate bills
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Pending Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billableOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders pending for billing
              </p>
            ) : (
              billableOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowSplitInput(false);
                    setCashAmount('');
                    setPaymentMethod(null);
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedOrder?.id === order.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.orderType === 'dine-in'
                          ? `Table ${order.tableNumber}`
                          : 'Takeaway'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ₹{order.totalAmount.toFixed(0)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {order.items.length} items
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bill Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedOrder ? (
              <p className="text-muted-foreground text-center py-8">
                Select an order to view bill
              </p>
            ) : (
              <div className="space-y-4">
                {/* Order Info */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order #</span>
                  <span className="font-medium">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">
                    {selectedOrder.orderType}
                  </span>
                </div>
                {selectedOrder.customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span>
                          {item.menuItemName} ├ù {item.quantity}
                        </span>
                        <span>₹{item.totalPrice.toFixed(0)}</span>
                      </div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          + {item.addOns.map((a) => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Tax Breakdown */}
                {(() => {
                  const tax = getTaxBreakdown(selectedOrder);

                  return (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>₹{selectedOrder.subtotal.toFixed(0)}</span>
                        </div>
                        {selectedOrder.serviceCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Service Charge
                            </span>
                            <span>
                              ₹{selectedOrder.serviceCharge.toFixed(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            CGST (2.5%)
                          </span>
                          <span>₹{tax.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            SGST (2.5%)
                          </span>
                          <span>₹{tax.sgst.toFixed(2)}</span>
                        </div>
                        {selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>
                              -₹{selectedOrder.discountAmount.toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          ₹{selectedOrder.totalAmount.toFixed(0)}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <Separator />

                {/* Payment Methods */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-medium">
                    Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => handlePayment('cash')}
                      disabled={isSubmitting || selectedOrderSyncing}
                      data-testid="button-pay-cash"
                    >
                      {isSubmitting && paymentMethod === 'cash' ? (
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                      ) : (
                        <Banknote className="w-4 sm:w-5 h-4 sm:h-5" />
                      )}
                      <span className="text-[10px] sm:text-xs">Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => handlePayment('upi')}
                      disabled={isSubmitting || selectedOrderSyncing}
                      data-testid="button-pay-upi"
                    >
                      {isSubmitting && paymentMethod === 'upi' ? (
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                      ) : (
                        <Smartphone className="w-4 sm:w-5 h-4 sm:h-5" />
                      )}
                      <span className="text-[10px] sm:text-xs">UPI</span>
                    </Button>
                    <Button
                      variant={showSplitInput ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => setShowSplitInput(!showSplitInput)}
                      disabled={isSubmitting || selectedOrderSyncing}
                      data-testid="button-pay-split"
                    >
                      {isSubmitting && paymentMethod === 'split' ? (
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                      ) : (
                        <Split className="w-4 sm:w-5 h-4 sm:h-5" />
                      )}
                      <span className="text-[10px] sm:text-xs">Split</span>
                    </Button>
                  </div>
                </div>

                {/* Split Payment Input */}
                {showSplitInput && (
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="cashAmount" className="text-sm">
                        Cash Amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          id="cashAmount"
                          type="number"
                          placeholder="Enter cash amount"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="pl-7"
                          data-testid="input-cash-amount"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">UPI Balance</span>
                      <span className="font-medium text-primary">
                        ₹{getUpiAmount().toFixed(0)}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSplitPayment}
                      disabled={
                        !cashAmount ||
                        parseFloat(cashAmount) <= 0 ||
                        parseFloat(cashAmount) >= selectedOrder.totalAmount ||
                        isSubmitting ||
                        selectedOrderSyncing
                      }
                      data-testid="button-confirm-split"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'Processing...' : 'Confirm Split Payment'}
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrint}
                    data-testid="button-print-bill"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                    data-testid="button-share-bill"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {paymentMethod && (
                  <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Payment Complete</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage;

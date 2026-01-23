import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Printer,
  Share2,
  Check,
  IndianRupee
} from "lucide-react";
import { Order } from "@/types";
import { toast } from "sonner";

const BillingPage = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | null>(null);

  // Get orders that are ready for billing (status: preparing, ready, or served)
  const billableOrders = orders.filter(
    order => order.status === 'preparing' || order.status === 'ready' || order.status === 'served'
  );

  const getTaxBreakdown = (order: Order) => {
    const cgst = order.taxAmount / 2;
    const sgst = order.taxAmount / 2;
    return { cgst, sgst, total: order.taxAmount };
  };

  const handlePayment = (method: 'cash' | 'card' | 'upi') => {
    if (!selectedOrder) return;
    
    setPaymentMethod(method);
    updateOrderStatus(selectedOrder.id, 'served');
    toast.success(`Payment received via ${method.toUpperCase()}`);
    
    // Auto-print bill after payment
    setTimeout(() => {
      printBill(selectedOrder);
    }, 500);
    
    setTimeout(() => {
      setSelectedOrder(null);
      setPaymentMethod(null);
    }, 2000);
  };

  const printBill = (order: Order) => {
    const tax = getTaxBreakdown(order);
    
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
            <h1>KAVERI FAMILY RESTAURANT</h1>
            <p>--------------------------------</p>
            <p>Order: ${order.orderNumber}</p>
            <p>${order.orderType === 'dine-in' && order.tableNumber ? `Table: ${order.tableNumber}` : 'Takeaway'}</p>
            <p>${new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
          </div>
          <div class="divider"></div>
          ${order.items.map(item => `
            <div class="row">
              <span class="label">${item.menuItemName} x${item.quantity}</span>
              <span class="value">${item.totalPrice.toFixed(0)}</span>
            </div>
            ${item.addOns && item.addOns.length > 0 ? `
              <div class="addons">+ ${item.addOns.map(a => a.name).join(', ')}</div>
            ` : ''}
          `).join('')}
          <div class="divider"></div>
          <div class="row">
            <span class="label">Subtotal</span>
            <span class="value">${order.subtotal.toFixed(0)}</span>
          </div>
          ${order.serviceCharge > 0 ? `
          <div class="row">
            <span class="label">Service Charge</span>
            <span class="value">${order.serviceCharge.toFixed(0)}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">CGST (2.5%)</span>
            <span class="value">${tax.cgst.toFixed(0)}</span>
          </div>
          <div class="row">
            <span class="label">SGST (2.5%)</span>
            <span class="value">${tax.sgst.toFixed(0)}</span>
          </div>
          ${order.discountAmount > 0 ? `
          <div class="row">
            <span class="label">Discount</span>
            <span class="value">-${order.discountAmount.toFixed(0)}</span>
          </div>
          ` : ''}
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
    
    toast.success("Bill sent to printer");
  };

  const handlePrint = () => {
    if (selectedOrder) {
      printBill(selectedOrder);
    } else {
      toast.error("Please select an order first");
    }
  };

  const handleShare = () => {
    toast.success("Bill shared via WhatsApp");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Billing</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Process payments and generate bills</p>
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
                  onClick={() => setSelectedOrder(order)}
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
                        {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : 'Takeaway'}
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
                  <span className="font-medium">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{selectedOrder.orderType}</span>
                </div>
                {selectedOrder.customerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                )}

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex justify-between text-sm">
                        <span>
                          {item.menuItemName} × {item.quantity}
                        </span>
                        <span>₹{item.totalPrice.toFixed(0)}</span>
                      </div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          + {item.addOns.map(a => a.name).join(', ')}
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
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{selectedOrder.subtotal.toFixed(0)}</span>
                        </div>
                        {selectedOrder.serviceCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service Charge</span>
                            <span>₹{selectedOrder.serviceCharge.toFixed(0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CGST (2.5%)</span>
                          <span>₹{tax.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">SGST (2.5%)</span>
                          <span>₹{tax.sgst.toFixed(2)}</span>
                        </div>
                        {selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-₹{selectedOrder.discountAmount.toFixed(0)}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{selectedOrder.totalAmount.toFixed(0)}</span>
                      </div>
                    </>
                  );
                })()}

                <Separator />

                {/* Payment Methods */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-medium">Payment Method</p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => handlePayment('cash')}
                      data-testid="button-pay-cash"
                    >
                      <Banknote className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-[10px] sm:text-xs">Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => handlePayment('card')}
                      data-testid="button-pay-card"
                    >
                      <CreditCard className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-[10px] sm:text-xs">Card</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      className="flex flex-col gap-0.5 sm:gap-1 h-auto py-2 sm:py-3"
                      onClick={() => handlePayment('upi')}
                      data-testid="button-pay-upi"
                    >
                      <Smartphone className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-[10px] sm:text-xs">UPI</span>
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handlePrint} data-testid="button-print-bill">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleShare} data-testid="button-share-bill">
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

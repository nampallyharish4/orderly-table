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

  // Get orders that are ready for billing (status: ready or served)
  const billableOrders = orders.filter(
    order => order.status === 'ready' || order.status === 'preparing'
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
      <html>
        <head>
          <title>Bill - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 18px; }
            .header p { margin: 5px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
            .item-addons { font-size: 10px; color: #666; margin-left: 10px; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Kaveri Family Restaurant</h1>
            <p>Order #${order.orderNumber}</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <div class="divider"></div>
          ${order.items.map(item => `
            <div class="item">
              <span>${item.menuItemName} x${item.quantity}</span>
              <span>₹${item.totalPrice.toFixed(0)}</span>
            </div>
            ${item.addOns && item.addOns.length > 0 ? `
              <div class="item-addons">+ ${item.addOns.map(a => a.name).join(', ')}</div>
            ` : ''}
          `).join('')}
          <div class="divider"></div>
          <div class="item">
            <span>Subtotal</span>
            <span>₹${order.subtotal.toFixed(0)}</span>
          </div>
          ${order.serviceCharge > 0 ? `
          <div class="item">
            <span>Service Charge</span>
            <span>₹${order.serviceCharge.toFixed(0)}</span>
          </div>
          ` : ''}
          <div class="item">
            <span>CGST (2.5%)</span>
            <span>₹${tax.cgst.toFixed(0)}</span>
          </div>
          <div class="item">
            <span>SGST (2.5%)</span>
            <span>₹${tax.sgst.toFixed(0)}</span>
          </div>
          ${order.discountAmount > 0 ? `
          <div class="item">
            <span>Discount</span>
            <span>-₹${order.discountAmount.toFixed(0)}</span>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="item total">
            <span>TOTAL</span>
            <span>₹${order.totalAmount.toFixed(0)}</span>
          </div>
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit again</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    toast.success("Bill printed successfully");
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

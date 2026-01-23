import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, User, Phone, Clock, UtensilsCrossed, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, deleteOrder } = useOrders();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-4">Order not found</h2>
        <Button onClick={() => navigate("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold truncate">Order #{order.id.split("-")[1]}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {format(new Date(order.createdAt), "PPp")}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <UtensilsCrossed className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Order Type</p>
                <p className="text-sm sm:text-base font-medium capitalize">{order.orderType}</p>
              </div>
            </div>

            {order.tableNumber && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-4 sm:h-5 w-4 sm:w-5 flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                  T
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Table</p>
                  <p className="text-sm sm:text-base font-medium">Table {order.tableNumber}</p>
                </div>
              </div>
            )}

            {order.customerName && (
              <div className="flex items-center gap-2 sm:gap-3">
                <User className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Customer</p>
                  <p className="text-sm sm:text-base font-medium truncate">{order.customerName}</p>
                </div>
              </div>
            )}

            {order.customerPhone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm sm:text-base font-medium">{order.customerPhone}</p>
                </div>
              </div>
            )}

            {order.pickupTime && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pickup Time</p>
                  <p className="text-sm sm:text-base font-medium">
                    {order.pickupTime instanceof Date 
                      ? format(order.pickupTime, "p") 
                      : order.pickupTime}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">{item.menuItemName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.unitPrice.toFixed(0)}
                    </p>
                    {item.notes && (
                      <p className="text-xs sm:text-sm text-accent italic mt-1 truncate">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-semibold font-mono-price shrink-0">
                    ₹{item.totalPrice.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
              <div className="flex justify-between text-base sm:text-lg font-bold">
                <span>Total</span>
                <span className="text-primary font-mono-price">₹{order.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <Button variant="outline" onClick={() => navigate("/orders")} className="flex-1 sm:flex-none">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="flex-1 sm:flex-none"
              data-testid="button-delete-order"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete order {order.orderNumber}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteOrder(order.id);
                  navigate("/orders");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default OrderDetailPage;

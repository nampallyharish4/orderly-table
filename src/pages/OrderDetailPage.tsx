import { useParams, useNavigate } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, User, Phone, Clock, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useOrders();

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Order #{order.id.split("-")[1]}</h1>
          <p className="text-muted-foreground">
            {format(new Date(order.createdAt), "PPp")}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <p className="font-medium capitalize">{order.orderType}</p>
              </div>
            </div>

            {order.tableId && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">
                  T
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">Table {order.tableId.split("-")[1]}</p>
                </div>
              </div>
            )}

            {order.customerName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{order.customerName}</p>
                </div>
              </div>
            )}

            {order.customerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              </div>
            )}

            {order.pickupTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Time</p>
                  <p className="font-medium">
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
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.menuItemName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{item.unitPrice.toFixed(0)}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-accent italic mt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">
                    ₹{item.totalPrice.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{order.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </div>
    </div>
  );
};

export default OrderDetailPage;

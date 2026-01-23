import { useState, useMemo } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useNavigate } from 'react-router-dom';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItem, OrderItem } from '@/types';
import { 
  Search, 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart,
  User,
  Phone,
  Clock,
  Send,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewOrderPage() {
  const { menuItems, categories, currentOrder, addItemToOrder, removeItemFromOrder, updateItemQuantity, submitOrder, addItemsToExistingOrder, cancelCurrentOrder, isLoading } = useOrders();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const isTakeaway = currentOrder?.orderType === 'takeaway';
  const isAddingToExisting = !!currentOrder?.existingOrderId;

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Calculate totals
  const subtotal = currentOrder?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const total = subtotal;

  const handleAddItem = (item: MenuItem) => {
    addItemToOrder(item, 1);
    toast.success(`Added ${item.name}`);
  };

  const handleSubmit = async () => {
    try {
      if (isAddingToExisting) {
        await addItemsToExistingOrder();
        toast.success('Items added to order!');
        navigate('/orders');
      } else {
        const order = await submitOrder(
          isTakeaway ? customerName : undefined,
          isTakeaway ? customerPhone : undefined
        );
        toast.success(`Order ${order.orderNumber} created!`);
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const handleCancel = () => {
    cancelCurrentOrder();
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading menu...</span>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No order in progress</p>
            <Button onClick={() => navigate('/tables')}>
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Button variant="ghost" size="icon" onClick={handleCancel} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {isAddingToExisting 
                ? `Add to Table ${currentOrder.tableNumber} Order`
                : isTakeaway 
                  ? 'New Takeaway Order' 
                  : `Table ${currentOrder.tableNumber}`
              }
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAddingToExisting ? 'Add more items to existing order' : 'Select items to add'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
            data-testid="input-search-menu"
          />
        </div>

        {/* Categories */}
        <div className="mb-3 sm:mb-4 -mx-2 sm:-mx-3 px-2 sm:px-3">
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-1.5 sm:gap-2 min-w-max">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs sm:text-sm flex-shrink-0"
                data-testid="category-all"
              >
                All
              </Button>
              {categories.filter(c => c.isActive).map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
                  data-testid={`category-${cat.id}`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pr-2 sm:pr-4">
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => handleAddItem(item)}
                compact
              />
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
              No items found
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Order Summary */}
      <Card className="w-full lg:w-80 xl:w-96 flex flex-col max-h-[50vh] lg:max-h-none">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="truncate">Order Summary</span>
            {(currentOrder.items?.length || 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{currentOrder.items?.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Customer Info for Takeaway */}
          {isTakeaway && (
            <div className="space-y-3 mb-4 pb-4 border-b border-border">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Name
                </Label>
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone (optional)
                </Label>
                <Input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone"
                />
              </div>
            </div>
          )}

          {/* Items List */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            {!currentOrder.items?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Tap on menu items to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.menuItemName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.unitPrice.toFixed(0)} each
                      </p>
                      {item.addOns.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          + {item.addOns.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity === 1) {
                            removeItemFromOrder(index);
                          } else {
                            updateItemQuantity(index, item.quantity - 1);
                          }
                        }}
                        data-testid={`button-decrease-${item.menuItemId}`}
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </Button>
                      <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.menuItemId}`}>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        data-testid={`button-increase-${item.menuItemId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-mono-price font-semibold w-20 text-right">
                      ₹{item.totalPrice.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals */}
          {(currentOrder.items?.length || 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-mono-price text-xl font-bold text-primary">
                  ₹{total.toFixed(0)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 space-y-2">
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
              disabled={!currentOrder.items?.length}
              onClick={handleSubmit}
              data-testid="button-send-to-kitchen"
            >
              <Send className="w-4 h-4 mr-2" />
              {isAddingToExisting ? 'Add Items to Order' : 'Send to Kitchen'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              data-testid="button-cancel-order"
            >
              Cancel Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

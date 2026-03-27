import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { API_BASE_URL } from '@/config';
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
  Loader2,
  Mic,
  MicOff,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PairingSuggestion {
  name: string;
  coOrderCount: number;
  totalOrders: number;
  pairRate: number;
}

export default function NewOrderPage() {
  const { menuItems, categories, currentOrder, addItemToOrder, removeItemFromOrder, updateItemQuantity, submitOrder, addItemsToExistingOrder, cancelCurrentOrder, isLoading } = useOrders();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // AI Recommendations state
  const [recommendations, setRecommendations] = useState<PairingSuggestion[]>([]);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [lastRecommendedCart, setLastRecommendedCart] = useState('');
  const recommendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current cart item names for comparison
  const cartItemNames = useMemo(() => {
    return currentOrder?.items?.map(i => i.menuItemName).sort().join(',') || '';
  }, [currentOrder?.items]);

  // Fetch analytics-based recommendations from order history
  const fetchRecommendations = useCallback(async () => {
    if (!currentOrder?.items?.length || currentOrder.items.length === 0) {
      setRecommendations([]);
      setLastRecommendedCart('');
      return;
    }

    const currentCartKey = cartItemNames;
    if (currentCartKey === lastRecommendedCart) return;

    try {
      setIsRecommendLoading(true);
      const itemNames = currentOrder.items.map(i => i.menuItemName);

      const response = await fetch(`${API_BASE_URL}/api/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemNames: itemNames }),
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        // Filter to only items available on the menu
        const validRecs = data.filter((rec: PairingSuggestion) => {
          const menuMatch = menuItems.find(
            m => m.name.toLowerCase() === rec.name?.toLowerCase() && m.isAvailable
          );
          return menuMatch;
        });
        setRecommendations(validRecs.slice(0, 4));
      }
      setLastRecommendedCart(currentCartKey);
    } catch (err) {
      console.error('Recommendation Error:', err);
    } finally {
      setIsRecommendLoading(false);
    }
  }, [currentOrder?.items, cartItemNames, lastRecommendedCart, menuItems]);

  // Debounced trigger for recommendations
  useEffect(() => {
    if (recommendDebounceRef.current) {
      clearTimeout(recommendDebounceRef.current);
    }
    if (currentOrder?.items?.length && currentOrder.items.length > 0 && cartItemNames !== lastRecommendedCart) {
      recommendDebounceRef.current = setTimeout(() => {
        fetchRecommendations();
      }, 500); // 500ms debounce
    }
    return () => {
      if (recommendDebounceRef.current) {
        clearTimeout(recommendDebounceRef.current);
      }
    };
  }, [cartItemNames]);

  const handleAddRecommendation = (recName: string) => {
    const menuItem = menuItems.find(m => m.name.toLowerCase() === recName.toLowerCase());
    if (menuItem) {
      addItemToOrder(menuItem, 1);
      setRecommendations(prev => prev.filter(r => r.name.toLowerCase() !== recName.toLowerCase()));
    }
  };

  // Voice Recognition Logic
  const handleVoiceOrder = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error('Speech Recognition Error', e);
      setIsListening(false);
      toast.error('Voice listening error. Try again.');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast.info(`Heard: "${transcript}"`, { duration: 3000 });
      
      try {
        setIsAiLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/ai/voice-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript })
        });
        
        const rawData = await response.json();
        const itemsToProcess = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        
        if (Array.isArray(itemsToProcess) && itemsToProcess.length > 0) {
          let foundCount = 0;
          itemsToProcess.forEach(voiceItem => {
            const vName = voiceItem.name?.toLowerCase().trim();
            if (!vName) return;
            
            const menuItem = menuItems.find(m => {
              const mName = m.name.toLowerCase().trim();
              return mName === vName || mName.includes(vName) || vName.includes(mName);
            });

            if (menuItem) {
              addItemToOrder(menuItem, Number(voiceItem.quantity) || 1);
              toast.success(`AI Added: ${menuItem.name}`, { icon: '🤖' });
              foundCount++;
            }
          });
          
          if (foundCount === 0) {
             toast.warning(`No items from your speech matched our menu. Try saying specific dish names!`);
          }
        }
      } catch (err) {
        console.error('Voice AI Error:', err);
        toast.error('AI was unable to process this. Try again?');
      } finally {
        setIsAiLoading(false);
      }
    };

    recognition.start();
  };

  const isTakeaway = currentOrder?.orderType === 'takeaway';
  const isAddingToExisting = !!currentOrder?.existingOrderId;

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

  const subtotal = currentOrder?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const total = subtotal;

  const handleAddItem = (item: MenuItem) => {
    addItemToOrder(item, 1);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isAddingToExisting) {
        await addItemsToExistingOrder();
        toast.success('Items added to order!');
        navigate('/orders');
      } else {
        const order = await submitOrder(
          isTakeaway ? customerName : undefined,
          isTakeaway ? customerPhone : undefined,
          undefined,
          true // expressCheckout flag
        );
        toast.success(`Order ${order.orderNumber} placed & paid!`);
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
      setShowMobileCart(false);
    }
  };

  const handleCancel = () => {
    cancelCurrentOrder();
    navigate(-1);
  };

  if (isLoading && menuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse scale-150" />
          <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Preparing your menu</h2>
          <p className="text-muted-foreground animate-pulse">Sourcing the freshest ingredients...</p>
        </div>
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
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] relative pb-20 lg:pb-0 overflow-hidden">
      {/* Full Screen Loader Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <Card className="p-8 flex flex-col items-center gap-4 bg-card shadow-2xl border-primary/20 animate-in fade-in zoom-in-95">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-bold text-xl">Processing Order...</h3>
              <p className="text-sm text-muted-foreground mt-1">Please do not refresh the page</p>
            </div>
          </Card>
        </div>
      )}
      {/* Menu Section */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-0">
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
          </div>
        </div>

        {/* Search + Voice */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-secondary/40 border-none"
            />
          </div>
          
          <button
            onClick={handleVoiceOrder}
            disabled={isAiLoading}
            className={cn(
               "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
               isListening ? "bg-red-500 text-white animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Categories Section */}
        <div className="mb-4 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-2 min-w-max pb-1 items-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300",
                selectedCategory === 'all' 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              All Items
            </button>
            {categories.filter(c => c.isActive).map(cat => {
              const nameUpper = (cat.name || "").toUpperCase();
              const isNonVeg = nameUpper.includes('NON-VEG') || nameUpper.includes('NON VEG') || nameUpper.includes('MUTTON') || nameUpper.includes('CHICKEN') || nameUpper.includes('FISH') || nameUpper.includes('EGG') || nameUpper.includes('MEAT');
              const isVeg = (nameUpper.includes('VEG') || nameUpper.includes('PANEER') || nameUpper.includes('SALAD')) && !isNonVeg;
              const isSelected = selectedCategory === cat.id;

              const activeClass = isNonVeg 
                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 scale-105"
                : isVeg 
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 scale-105"
                  : "bg-primary text-white shadow-lg shadow-primary/25 scale-105";

              const inactiveClass = isNonVeg
                ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20"
                : isVeg
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground";

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap",
                    isSelected ? activeClass : inactiveClass
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => handleAddItem(item)}
                compact
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Order Summary - Desktop Side Panel */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col border border-border/50 bg-card rounded-[2.5rem] shadow-glow-primary/10 overflow-hidden sticky top-6 h-[calc(100vh-140px)] animate-slide-in-right">
        <OrderSummaryContent />
      </div>

      {/* Mobile Cart Full Screen View */}
      <div className={cn(
        "fixed inset-0 z-[60] bg-background lg:hidden transition-transform duration-300 ease-in-out",
        showMobileCart ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="font-bold text-lg">My Order</h2>
              <Badge variant="secondary" className="rounded-full">{currentOrder.items?.length || 0}</Badge>
            </div>
            <Button variant="ghost" className="text-destructive font-semibold" onClick={handleCancel}>
              Discard
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <OrderSummaryContent isMobile />
          </ScrollArea>
        </div>
      </div>

      {/* Hidden Mobile Cart Trigger (for Navbar to use) */}
      <Button 
        id="mobile-cart-button"
        className="hidden" 
        onClick={() => setShowMobileCart(true)}
      />
    </div>
  );

  // Extracted Component for Cart Content
  function OrderSummaryContent({ isMobile = false } : { isMobile?: boolean }) {
    if (!currentOrder) return null;
      return (
      <div className="flex flex-col h-full relative">
        <ScrollArea className="flex-1">
          <div className={cn("flex flex-col flex-1", isMobile ? "p-4 pb-32" : "p-6")}>
            {/* Takeaway Details */}
            {isTakeaway && (
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Customer Details</Label>
                  <div className="grid gap-2">
                    <Input
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                    <Input
                      placeholder="Phone Number (Optional)"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Selected Items</Label>
              {!currentOrder.items?.length ? (
                <div className="text-center py-12 opacity-40">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOrder.items.map((item, index) => (
                    <div key={`${item.menuItemId}-${index}`} className="flex items-center gap-3 p-3.5 rounded-3xl bg-secondary/30 border border-border/50 transition-all hover:bg-secondary/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.menuItemName}</p>
                        <p className="text-xs text-primary font-bold">₹{item.totalPrice}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-background rounded-xl p-1 border">
                        <Button
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => item.quantity === 1 ? removeItemFromOrder(index) : updateItemQuantity(index, item.quantity - 1)}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <Button
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-8 mb-4">
                <Label className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Recommended for you</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {recommendations.map((rec, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddRecommendation(rec.name)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-left hover:bg-emerald-500/10 transition-colors"
                    >
                      <span className="text-xs font-bold truncate flex-1">{rec.name}</span>
                      <Plus className="w-4 h-4 text-emerald-600 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className={cn(
          "bg-card border-t p-6 space-y-4 shadow-lg",
          isMobile && "fixed bottom-0 left-0 right-0 p-4"
        )}>
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-muted-foreground">Subtotal</span>
            <span className="text-xl font-black text-primary font-mono-price">₹{total.toFixed(0)}</span>
          </div>
          <Button
            className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20"
            disabled={!currentOrder.items?.length || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                Processing order...
              </span>
            ) : (
              <>{isAddingToExisting ? "Confirm Changes" : "Place & Pay Cash"}</>
            )}
          </Button>
        </div>
      </div>
    );
  }
}

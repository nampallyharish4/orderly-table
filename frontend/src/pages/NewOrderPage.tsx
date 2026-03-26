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
      }, 500); // 500ms debounce — fast since it's just DB analytics
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
      toast.success(`Added ${menuItem.name}`, { icon: '✨' });
      // Remove from recommendations
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
            
            // Map AI name to real MenuItem
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
          isTakeaway ? customerPhone : undefined
        );
        toast.success(`Order ${order.orderNumber} created!`);
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancelCurrentOrder();
    navigate(-1);
  };

  if (isLoading && menuItems.length === 0) {
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
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] relative pb-24 lg:pb-0">
      {/* Menu Section */}
      <div id="menu-header" className="flex-1 flex flex-col min-w-0">
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

        {/* Search + Voice */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
            <Input
              placeholder="Search dishes, categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 h-12 text-sm sm:text-base rounded-2xl bg-secondary/50 border-border/50 focus:border-primary/40 focus:bg-background transition-all placeholder:text-muted-foreground/50"
              data-testid="input-search-menu"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Voice Order Button - Prominent & Attractive */}
          <button
            onClick={handleVoiceOrder}
            disabled={isAiLoading}
            title="Voice Order — Speak your order"
            className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 scale-110' 
                : isAiLoading
                  ? 'bg-muted text-muted-foreground cursor-wait'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            {/* Pulsing ring when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-2xl bg-red-500/40 animate-ping" />
                <span className="absolute -inset-1 rounded-2xl border-2 border-red-400/50 animate-pulse" />
              </>
            )}
            {isAiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            ) : isListening ? (
              <MicOff className="w-5 h-5 relative z-10" />
            ) : (
              <Mic className="w-5 h-5 relative z-10" />
            )}
          </button>
        </div>

        {/* Categories - Color Coded Pill Style */}
        <div className="mb-3 sm:mb-4">
          <div className="overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategory('all')}
                data-testid="category-all"
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/25 scale-105'
                    : 'bg-secondary/60 text-foreground/70 hover:bg-secondary hover:text-foreground border border-border/50'
                }`}
              >
                🍽️ All Items
              </button>
              {categories.filter(c => c.isActive).map(cat => {
                const nameUpper = cat.name.toUpperCase();
                const isNonVeg = nameUpper.includes('NON VEG') || nameUpper.includes('NON-VEG') || nameUpper.includes('NONVEG') || nameUpper.includes('CHICKEN') || nameUpper.includes('MUTTON') || nameUpper.includes('FISH') || nameUpper.includes('EGG');
                const isVeg = !isNonVeg;
                const isSelected = selectedCategory === cat.id;

                const selectedClass = isVeg
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/25 scale-105';

                const unselectedClass = isVeg
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50';

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`category-${cat.id}`}
                    className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                      isSelected ? selectedClass : unselectedClass
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isVeg 
                        ? isSelected ? 'bg-white shadow-sm' : 'bg-emerald-500'
                        : isSelected ? 'bg-white shadow-sm' : 'bg-red-500'
                    }`} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pr-2 sm:pr-4">
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
      <Card id="order-summary" className="w-full lg:w-80 xl:w-96 flex flex-col scroll-mt-24 max-h-[60vh] lg:max-h-none border-primary/20 shadow-xl shadow-primary/5 lg:shadow-none lg:border-border">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="truncate">Order Summary</span>
            {(currentOrder.items?.length || 0) > 0 && (
              <Badge variant="secondary" className="text-xs">{currentOrder.items?.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
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
          <div className="flex-1 -mx-4 px-4 overflow-y-auto min-h-0 touch-pan-y scrollbar-thin pt-2">
            {!currentOrder.items?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Tap on menu items to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.menuItemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-muted-foreground">
                          ₹{item.unitPrice.toFixed(0)} each
                        </span>
                        <span className="font-mono-price text-sm font-semibold text-primary">
                          = ₹{item.totalPrice.toFixed(0)}
                        </span>
                      </div>
                      {item.addOns.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          + {item.addOns.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
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
                      <span className="w-6 text-center font-medium text-sm" data-testid={`text-quantity-${item.menuItemId}`}>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        data-testid={`button-increase-${item.menuItemId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Frequently Ordered Together Section */}
                {(recommendations.length > 0 || isRecommendLoading) && (
                  <div className="mt-2">
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-orange-600">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Frequently Ordered Together
                      </span>
                      {isRecommendLoading && (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-auto" />
                      )}
                    </div>

                    {isRecommendLoading && recommendations.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span className="text-xs text-muted-foreground">Analyzing order history...</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {recommendations.map((rec, idx) => {
                          const menuItem = menuItems.find(m => m.name.toLowerCase() === rec.name.toLowerCase());
                          return (
                            <button
                              key={`rec-${idx}`}
                              onClick={() => handleAddRecommendation(rec.name)}
                              className="w-full group flex items-center gap-2 p-2.5 rounded-lg 
                                         bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.03]
                                         border border-amber-500/10
                                         hover:border-amber-500/30 hover:from-amber-500/[0.12] hover:to-orange-500/[0.06]
                                         active:scale-[0.98] transition-all duration-200"
                            >
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-medium truncate max-w-[120px]">{rec.name}</span>
                                  <Badge 
                                    variant="secondary" 
                                    className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/15 text-amber-500 border-0 shrink-0"
                                  >
                                    {rec.pairRate}% pair rate
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  Ordered together {rec.coOrderCount} of {rec.totalOrders} times
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {menuItem && (
                                  <span className="text-xs font-mono-price font-semibold text-primary">
                                    ₹{menuItem.price.toFixed(0)}
                                  </span>
                                )}
                                <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center 
                                              group-hover:bg-amber-500/25 transition-colors">
                                  <Plus className="w-3 h-3 text-amber-500" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
          {/* Actions */}
          <div className="mt-4 space-y-2">
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
              disabled={!currentOrder.items?.length || isSubmitting}
              onClick={handleSubmit}
              data-testid="button-send-to-kitchen"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Processing...' : isAddingToExisting ? 'Add Items to Order' : 'Send to Kitchen'}
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

      {/* Mobile Floating Cart Bar */}
      {(currentOrder.items?.length || 0) > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
            <div className="pl-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{currentOrder.items?.length} Items Added</p>
              <p className="font-bold text-lg text-primary font-mono-price leading-tight">₹{total.toFixed(0)}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="rounded-xl border-border bg-background hover:bg-secondary/80 px-4 shadow-sm"
                onClick={() => document.getElementById('menu-header')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Menu
              </Button>
              <Button 
                size="default" 
                className="bg-gradient-primary rounded-xl shadow-lg shadow-primary/25 min-w-[120px]"
                onClick={() => document.getElementById('order-summary')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

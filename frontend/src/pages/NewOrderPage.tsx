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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { getMenuItemImage } from '@/utils/menuImages';
import {
  buildSupabaseMenuRenderUrl,
  getOptimizedMenuImageUrl,
} from '@/utils/menuImageOptimization';

interface PairingSuggestion {
  name: string;
  coOrderCount: number;
  totalOrders: number;
  pairRate: number;
}

export default function NewOrderPage() {
  const {
    menuItems,
    categories,
    currentOrder,
    addItemToOrder,
    decrementItemByMenuItemId,
    removeItemFromOrder,
    updateItemQuantity,
    submitOrder,
    addItemsToExistingOrder,
    cancelCurrentOrder,
    setOrderType,
    isLoading,
  } = useOrders();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [cartConfirmation, setCartConfirmation] = useState('');
  const cartConfirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // AI Recommendations state
  const [recommendations, setRecommendations] = useState<PairingSuggestion[]>(
    [],
  );
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);
  const [lastRecommendedCart, setLastRecommendedCart] = useState('');
  const recommendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const prefetchedMenuImageUrlsRef = useRef<Set<string>>(new Set());

  // Get current cart item names for comparison
  const cartItemNames = useMemo(() => {
    return (
      currentOrder?.items
        ?.map((i) => i.menuItemName)
        .sort()
        .join(',') || ''
    );
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
      const itemNames = currentOrder.items.map((i) => i.menuItemName);

      const response = await fetch(`${API_BASE_URL}/api/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemNames: itemNames }),
      });

      if (!response.ok) {
        setRecommendations([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // Filter to only items available on the menu
        const validRecs = data.filter((rec: PairingSuggestion) => {
          // Try exact match first
          const exactMatch = menuItems.find(
            (m) => m.name.toLowerCase() === rec.name?.toLowerCase(),
          );

          // If exact match, check availability
          if (exactMatch) {
            return exactMatch.isAvailable;
          }

          // Fallback: try partial match (in case there are minor differences)
          const partialMatch = menuItems.find(
            (m) =>
              m.name.toLowerCase().includes(rec.name?.toLowerCase() || '') ||
              rec.name?.toLowerCase().includes(m.name.toLowerCase()),
          );

          if (partialMatch) {
            return partialMatch.isAvailable;
          }

          return false;
        });

        setRecommendations(validRecs.slice(0, 4));
      } else {
        setRecommendations([]);
      }
      setLastRecommendedCart(currentCartKey);
    } catch (err) {
      console.error('[RECOMMENDATIONS] Fetch error:', err);
      setRecommendations([]);
    } finally {
      setIsRecommendLoading(false);
    }
  }, [currentOrder?.items, cartItemNames, lastRecommendedCart, menuItems]);

  // Debounced trigger for recommendations
  useEffect(() => {
    if (recommendDebounceRef.current) {
      clearTimeout(recommendDebounceRef.current);
    }
    if (
      currentOrder?.items?.length &&
      currentOrder.items.length > 0 &&
      cartItemNames !== lastRecommendedCart
    ) {
      recommendDebounceRef.current = setTimeout(() => {
        fetchRecommendations();
      }, 500); // 500ms debounce
    }
    return () => {
      if (recommendDebounceRef.current) {
        clearTimeout(recommendDebounceRef.current);
      }
    };
  }, [cartItemNames, lastRecommendedCart, fetchRecommendations]);

  const handleAddRecommendation = (recName: string) => {
    const menuItem = menuItems.find(
      (m) => m.name.toLowerCase() === recName.toLowerCase(),
    );
    if (menuItem) {
      addItemToOrder(menuItem, 1);
      setCartConfirmation(`${menuItem.name} added to cart`);
      if (cartConfirmationTimerRef.current) {
        clearTimeout(cartConfirmationTimerRef.current);
      }
      cartConfirmationTimerRef.current = setTimeout(() => {
        setCartConfirmation('');
        cartConfirmationTimerRef.current = null;
      }, 1800);
      setRecommendations((prev) =>
        prev.filter((r) => r.name.toLowerCase() !== recName.toLowerCase()),
      );
    }
  };

  // Voice Recognition Logic
  const handleVoiceOrder = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
          body: JSON.stringify({ text: transcript }),
        });

        const rawData = await response.json();
        const itemsToProcess =
          typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

        if (Array.isArray(itemsToProcess) && itemsToProcess.length > 0) {
          let foundCount = 0;
          itemsToProcess.forEach((voiceItem) => {
            const vName = voiceItem.name?.toLowerCase().trim();
            if (!vName) return;

            const menuItem = menuItems.find((m) => {
              const mName = m.name.toLowerCase().trim();
              return (
                mName === vName ||
                mName.includes(vName) ||
                vName.includes(mName)
              );
            });

            if (menuItem) {
              addItemToOrder(menuItem, Number(voiceItem.quantity) || 1);
              toast.success(`AI Added: ${menuItem.name}`, { icon: '🤖' });
              foundCount++;
            }
          });

          if (foundCount === 0) {
            toast.warning(
              `No items from your speech matched our menu. Try saying specific dish names!`,
            );
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
    return menuItems.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory)
        return false;
      if (searchQuery) {
        return (
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  useEffect(() => {
    const firstViewportImageUrls = filteredItems
      .slice(0, 12)
      .flatMap((item) => {
        const fallbackSupabaseUrl = buildSupabaseMenuRenderUrl(
          `${item.id}.jpg`,
          480,
          300,
          60,
        );
        const sourceUrl =
          item.imageUrl || getMenuItemImage(item.name) || fallbackSupabaseUrl;
        const optimizedUrl = getOptimizedMenuImageUrl(sourceUrl, 480, 300, 60);
        const previewUrl = getOptimizedMenuImageUrl(sourceUrl, 24, 24, 25);

        return previewUrl && previewUrl !== optimizedUrl
          ? [previewUrl, optimizedUrl]
          : [optimizedUrl];
      });

    firstViewportImageUrls.forEach((url) => {
      if (!url || prefetchedMenuImageUrlsRef.current.has(url)) return;

      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      prefetchedMenuImageUrlsRef.current.add(url);
    });
  }, [filteredItems]);

  const subtotal =
    currentOrder?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const total = subtotal;

  useEffect(() => {
    return () => {
      if (cartConfirmationTimerRef.current) {
        clearTimeout(cartConfirmationTimerRef.current);
      }
    };
  }, []);

  const getItemQuantity = (itemId: string) => {
    return currentOrder?.items?.reduce((sum, i) => {
      if (i.menuItemId === itemId) return sum + i.quantity;
      return sum;
    }, 0) || 0;
  };

  const handleIncrement = useCallback((item: MenuItem) => {
    addItemToOrder(item, 1);
  }, [addItemToOrder]);

  const handleDecrement = useCallback((item: MenuItem) => {
    decrementItemByMenuItemId(item.id);
  }, [decrementItemByMenuItemId]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const withTimeout = useCallback(
    async <T,>(promise: Promise<T>, timeoutMs = 20000): Promise<T> => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timed out. Please try again.'));
        }, timeoutMs);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    },
    [],
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isAddingToExisting) {
        await withTimeout(addItemsToExistingOrder());
        toast.success('Items added to order!');
        navigate('/orders', {
          state: { orderConfirmation: 'Order updated successfully' },
        });
      } else {
        // Place instantly in UI and continue server reconciliation in background.
        const submitPromise = submitOrder(
          isTakeaway ? customerName : undefined,
          isTakeaway ? customerPhone : undefined,
          undefined,
          false,
        );

        navigate('/orders', {
          state: { orderConfirmation: 'Order placed successfully' },
        });

        submitPromise
          .then(() => {})
          .catch((error: any) => {
            toast.error(
              error?.message || 'Order sync failed. Please retry if needed.',
            );
          });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create order');
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Preparing your menu
          </h2>
          <p className="text-muted-foreground animate-pulse">
            Sourcing the freshest ingredients...
          </p>
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
            <Button onClick={() => navigate('/tables')}>Start New Order</Button>
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
              <p className="text-sm text-muted-foreground mt-1">
                Finalizing your order
              </p>
            </div>
          </Card>
        </div>
      )}
      {/* Menu Section */}
      <div className="flex-1 flex flex-col min-w-0 p-4 pb-24 lg:pb-0 lg:p-0">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              {isAddingToExisting
                ? `Add to Table ${currentOrder.tableNumber} Order`
                : isTakeaway
                  ? 'New Takeaway Order'
                  : `Table ${currentOrder.tableNumber}`}
            </h1>
          </div>
        </div>

        {/* Search + Voice */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="Search for food"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/40 border border-border/60 focus:border-primary/40"
            />
          </div>

          <button
            onClick={handleVoiceOrder}
            disabled={isAiLoading}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all border border-border/60',
              isListening
                ? 'bg-red-500 text-white animate-pulse border-red-500'
                : 'bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30',
            )}
          >
            {isAiLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {cartConfirmation && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1 duration-200">
            {cartConfirmation}
          </div>
        )}

        {/* Categories Section */}
        <ScrollArea className="mb-4 w-full whitespace-nowrap">
          <div className="flex gap-2 min-w-max pb-1 items-center pr-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300',
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              All Items
            </button>
            {categories
              .filter((c) => c.isActive)
              .map((cat) => {
                const nameUpper = (cat.name || '').toUpperCase();
                const isNonVeg =
                  nameUpper.includes('NON-VEG') ||
                  nameUpper.includes('NON VEG') ||
                  nameUpper.includes('MUTTON') ||
                  nameUpper.includes('CHICKEN') ||
                  nameUpper.includes('FISH') ||
                  nameUpper.includes('EGG') ||
                  nameUpper.includes('MEAT');
                const isVeg =
                  (nameUpper.includes('VEG') ||
                    nameUpper.includes('PANEER') ||
                    nameUpper.includes('SALAD')) &&
                  !isNonVeg;
                const isSelected = selectedCategory === cat.id;

                const activeClass = isNonVeg
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 scale-105'
                  : isVeg
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 scale-105'
                    : 'bg-primary text-white shadow-lg shadow-primary/25 scale-105';

                const inactiveClass = isNonVeg
                  ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : isVeg
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground';

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap',
                      isSelected ? activeClass : inactiveClass,
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Menu Items */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
             {filteredItems.map((item) => (
               <MenuItemCard
                 key={item.id}
                 item={item}
                 quantity={getItemQuantity(item.id)}
                 onIncrement={() => handleIncrement(item)}
                 onDecrement={() => handleDecrement(item)}
                 compact
               />
             ))}
          </div>
        </ScrollArea>
      </div>

      {/* Order Summary - Desktop Side Panel */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col border border-border/50 bg-card rounded-2xl shadow-lg overflow-hidden sticky top-6 h-[calc(100vh-120px)] animate-slide-in-right">
        {renderOrderSummaryContent()}
      </div>

      {/* Mobile Cart Entry Bar */}
      {!showMobileCart && (currentOrder?.items?.length || 0) > 0 && (
        <div className="fixed bottom-[72px] left-3 right-3 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setShowMobileCart(true)}
            className="w-full h-14 rounded-2xl text-white shadow-xl flex items-center justify-between px-5"
            style={{
              background: 'linear-gradient(135deg, hsl(4 72% 54%), hsl(24 90% 50%))',
              boxShadow: '0 8px 24px -4px hsl(12 85% 48% / 0.4)',
            }}
          >
            <span className="font-bold text-sm">View Cart</span>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-white/20 text-white border-white/20"
              >
                {currentOrder?.items?.length || 0}
              </Badge>
              <span className="font-mono-price text-base font-extrabold">
                ₹{total.toFixed(0)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Full Screen View */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-background lg:hidden transition-transform duration-300 ease-in-out',
          showMobileCart ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border/40" style={{ background: 'hsl(20 20% 10%)', borderBottom: '1px solid hsl(20 15% 16%)' }}>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)} style={{ color: 'hsl(30 15% 80%)' }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-bold text-base" style={{ color: 'hsl(30 15% 92%)' }}>My Order</h2>
              <Badge variant="secondary" className="rounded-full text-xs">
                {currentOrder.items?.length || 0}
              </Badge>
            </div>
            <Button variant="ghost" onClick={handleCancel} className="text-xs font-semibold" style={{ color: 'hsl(4 72% 60%)' }}>
              Discard
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {renderOrderSummaryContent(true)}
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

  // Render cart content without creating a nested component type each render.
  function renderOrderSummaryContent(isMobile = false) {
    if (!currentOrder) return null;
    return (
      <div className="flex flex-col h-full relative">
        {/* Cart Header */}
        {!isMobile && (
          <div className="px-6 pt-5 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Cart Details</h2>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors min-h-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="2" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
                  <circle cx="14" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
                </svg>
              </button>
            </div>
            {/* Order type toggle */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
              <button
                onClick={() => setOrderType('dine-in')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-0 flex items-center justify-center gap-1.5',
                  !isTakeaway
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="w-3 h-3 rounded" style={{ background: isTakeaway ? 'transparent' : 'hsl(24 90% 50%)', border: isTakeaway ? '1px solid hsl(var(--muted-foreground) / 0.3)' : 'none' }} />
                Dine in
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-0 flex items-center justify-center gap-1.5',
                  isTakeaway
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isTakeaway ? 'hsl(24 90% 50%)' : 'hsl(var(--muted-foreground) / 0.3)' }} />
                Takeaway
              </button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div
            className={cn(
              'flex flex-col flex-1',
              isMobile ? 'p-4 pb-32' : 'px-6 py-4',
            )}
          >
            {/* Customer Information */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Customer information</h3>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors min-h-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="2" cy="7" r="1.2" fill="currentColor" opacity="0.4" />
                    <circle cx="7" cy="7" r="1.2" fill="currentColor" opacity="0.4" />
                    <circle cx="12" cy="7" r="1.2" fill="currentColor" opacity="0.4" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Customer name</label>
                  <Input
                    placeholder="Enter name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10 rounded-xl bg-muted/20 border-border/60 text-sm"
                  />
                </div>
                {!isTakeaway && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Table location</label>
                    <div className="h-10 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between px-3 text-sm text-muted-foreground">
                      <span>Table {currentOrder?.tableNumber || 'N/A'}</span>
                    </div>
                  </div>
                )}
                {isTakeaway && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone number</label>
                    <Input
                      placeholder="Phone Number (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-10 rounded-xl bg-muted/20 border-border/60 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Order items</h3>
                {currentOrder.items?.length > 0 && (
                  <button
                    onClick={handleCancel}
                    className="text-xs font-medium min-h-0 px-2 py-1 rounded-lg transition-colors"
                    style={{ color: 'hsl(4 72% 54%)' }}
                  >
                    Clear all items
                  </button>
                )}
              </div>

              {!currentOrder.items?.length ? (
                <div className="text-center py-10 opacity-40">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOrder.items.map((item, index) => (
                    <div
                      key={`${item.menuItemId}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40 transition-all hover:bg-muted/30"
                    >
                      {/* Item image */}
                      <div className="w-12 h-12 rounded-xl bg-muted/30 overflow-hidden shrink-0">
                        <img
                          src={menuItems.find(m => m.id === item.menuItemId)?.imageUrl || getMenuItemImage(item.menuItemName)}
                          alt={item.menuItemName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg">🍽️</div>';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {item.menuItemName}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.addOns.length > 0 ? item.addOns.map(a => a.name).join(', ') : 'Selected item'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-mono-price text-sm font-bold">
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-0 border border-border/60 rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-none min-h-0 text-primary"
                              onClick={() =>
                                item.quantity === 1
                                  ? removeItemFromOrder(index)
                                  : updateItemQuantity(index, item.quantity - 1)
                              }
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </Button>
                            <span className="w-6 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-none min-h-0 text-primary"
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: 'hsl(152 60% 42%)' }} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    You might also like
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {recommendations.map((rec, idx) => {
                    const menuItem = menuItems.find(m => m.name.toLowerCase() === rec.name.toLowerCase());
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAddRecommendation(rec.name)}
                        className="flex flex-col p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-left hover:bg-emerald-500/10 transition-all hover:shadow-sm group active:scale-95"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-[11px] font-bold leading-tight line-clamp-2 pr-4">
                            {rec.name}
                          </span>
                          <Plus className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-125" style={{ color: 'hsl(152 60% 42%)' }} />
                        </div>
                        {menuItem && (
                          <span className="text-[11px] font-mono-price font-bold" style={{ color: 'hsl(152 60% 35%)' }}>
                            ₹{menuItem.price.toFixed(0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Sticky Footer - Total + Proceed */}
        <div
          className={cn(
            'bg-card border-t border-border/40',
            isMobile ? 'fixed bottom-0 left-0 right-0 p-4' : 'px-6 py-4',
          )}
        >
          {/* Total */}
          {currentOrder.items?.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-foreground">Total amount</span>
              <span className="font-mono-price text-lg font-extrabold text-foreground">
                ₹{total.toFixed(2)}
              </span>
            </div>
          )}

          {/* Proceed button */}
          <Button
            className="w-full h-12 rounded-xl text-white font-bold text-sm shadow-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, hsl(4 72% 54%), hsl(24 90% 50%))',
              boxShadow: '0 6px 20px -4px hsl(12 85% 48% / 0.35)',
            }}
            disabled={!currentOrder.items?.length || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {isAddingToExisting ? 'Confirm Changes' : 'Place Order'}
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }
}

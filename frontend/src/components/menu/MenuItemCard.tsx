import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Minus } from 'lucide-react';
import { getMenuItemImage } from '@/utils/menuImages';
import { CachedMenuImage } from './CachedMenuImage';

interface MenuItemCardProps {
  item: MenuItem;
  onIncrement?: () => void;
  onDecrement?: () => void;
  quantity?: number;
  compact?: boolean;
}

export const MenuItemCard = memo(function MenuItemCard({
  item,
  onIncrement,
  onDecrement,
  quantity = 0,
  compact,
}: MenuItemCardProps) {
  const imageUrl = item.imageUrl || getMenuItemImage(item.name);

  if (compact) {
    return (
      <div
        data-testid={`menu-item-${item.id}`}
        onClick={() => {
          if (item.isAvailable && quantity === 0 && onIncrement) {
            onIncrement();
          }
        }}
        className={cn(
          'relative w-full text-left group bg-card border border-border/60 rounded-2xl overflow-hidden transition-all',
          'hover:shadow-md hover:border-primary/30',
          item.isAvailable && quantity === 0 && 'cursor-pointer hover:-translate-y-0.5',
          !item.isAvailable && 'opacity-50 cursor-not-allowed grayscale-[0.3]',
        )}
        style={{ boxShadow: '0 1px 3px -1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)' }}
      >
        {/* Image Section */}
        <div className="relative w-full">
          {imageUrl ? (
            <div className="w-full aspect-[16/10] overflow-hidden bg-muted/30">
              <CachedMenuImage
                src={imageUrl}
                alt={item.name}
                cacheKey={`${item.id || item.name}:${imageUrl}`}
                width={480}
                height={300}
                quality={60}
                loading="lazy"
                fetchPriority="auto"
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  quantity === 0 && "group-hover:scale-105"
                )}
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/10] bg-muted/20 flex items-center justify-center">
              <span className="text-3xl opacity-30">🍽️</span>
            </div>
          )}

          {/* Quantity Overlay on Image */}
          {quantity > 0 && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
              <div className="flex items-center gap-0 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full shadow-2xl scale-110">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDecrement) onDecrement();
                  }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-full"
                >
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
                <span className="w-8 text-center text-sm font-extrabold text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onIncrement) onIncrement();
                  }}
                  className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-full"
                >
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content below image */}
        <div className="p-3 sm:p-4 space-y-1.5">
          {/* Price */}
          <span className="font-mono-price text-base sm:text-lg font-extrabold text-foreground block">
            ₹{item.price.toFixed(2)}
          </span>

          {/* Name */}
          <p className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-2">
            {item.name}
          </p>

          {/* Description */}
          {item.description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Tags row (veg/non-veg + prep time) */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.isVeg ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                Veg
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                Non-Veg
              </span>
            )}
            {item.preparationTime && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Clock className="w-3 h-3" />
                {item.preparationTime}m
              </span>
            )}
          </div>
        </div>

        {/* Unavailable overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl z-20">
            <Badge variant="secondary">Unavailable</Badge>
          </div>
        )}
      </div>
    );
  }


  // Non-compact (large) version
  return (
    <div
      onClick={() => {
        if (item.isAvailable && quantity === 0 && onIncrement) {
          onIncrement();
        }
      }}
      className={cn(
        'menu-card w-full text-left group relative transition-all duration-300',
        item.isAvailable && quantity === 0 && 'cursor-pointer hover:border-primary/40',
        !item.isAvailable && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="relative">
        {imageUrl ? (
          <div className="aspect-video rounded-xl bg-muted/30 mb-3 overflow-hidden relative">
            <CachedMenuImage
              src={imageUrl}
              alt={item.name}
              cacheKey={`${item.id || item.name}:${imageUrl}`}
              width={640}
              height={360}
              quality={60}
              loading="lazy"
              fetchPriority="auto"
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                quantity === 0 && "group-hover:scale-105"
              )}
            />
            {/* Quantity Overlay for Large Card */}
            {quantity > 0 && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in-50 duration-200">
                <div className="flex items-center gap-0 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-full shadow-2xl scale-125">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDecrement) onDecrement();
                    }}
                    className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-full"
                  >
                    <Minus className="w-5 h-5 text-foreground" />
                  </button>
                  <span className="w-10 text-center text-lg font-black text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onIncrement) onIncrement();
                    }}
                    className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-full"
                  >
                    <Plus className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-muted/20 mb-3 flex items-center justify-center relative">
            <span className="text-4xl opacity-30">🍽️</span>
            {quantity > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                <div className="flex items-center gap-0 bg-white/95 dark:bg-black/95 rounded-full shadow-xl">
                  {/* ... same buttons as above but simpler ... */}
                  <button onClick={(e)=>{e.stopPropagation(); onDecrement?.()}} className="w-10 h-10 flex items-center justify-center"><Minus className="w-4 h-4"/></button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={(e)=>{e.stopPropagation(); onIncrement?.()}} className="w-10 h-10 flex items-center justify-center"><Plus className="w-4 h-4"/></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {item.isVeg ? (
            <div className="w-4 h-4 rounded border-2 border-success flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded border-2 border-destructive flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
            </div>
          )}
          <h3 className="font-bold text-sm sm:text-base">{item.name}</h3>
        </div>
      </div>

      {item.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-1">
          {item.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono-price text-lg sm:text-xl font-bold text-primary">
          ₹{item.price.toFixed(0)}
        </span>
      </div>

      {!item.isAvailable && (
        <Badge variant="secondary" className="mt-2 text-[10px]">
          Unavailable
        </Badge>
      )}
    </div>
  );
});

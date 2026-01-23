import { cn } from '@/lib/utils';
import { MenuItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Leaf, CircleDot, Plus, Clock } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onClick?: () => void;
  compact?: boolean;
}

export function MenuItemCard({ item, onClick, compact }: MenuItemCardProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!item.isAvailable}
        data-testid={`menu-item-${item.id}`}
        className={cn(
          'w-full p-2 sm:p-3 rounded-xl border border-border text-left transition-all',
          'hover:border-primary/50 hover:bg-secondary/50 active:scale-[0.98]',
          'shadow-sm hover:shadow-md',
          !item.isAvailable && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex gap-2 sm:gap-3">
          {item.imageUrl ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl opacity-50">🍽️</span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                {item.isVeg ? (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 border-success flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 border-destructive flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive" />
                  </div>
                )}
                <span className="font-semibold text-xs sm:text-sm leading-tight truncate">{item.name}</span>
              </div>
              {item.description && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{item.description}</p>
              )}
            </div>
            <span className="font-mono-price text-sm sm:text-base font-bold text-primary">
              ₹{item.price.toFixed(0)}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!item.isAvailable}
      className={cn(
        'menu-card w-full text-left group',
        !item.isAvailable && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Image placeholder or generated image would go here */}
      {item.imageUrl ? (
        <div className="aspect-video rounded-lg bg-secondary mb-3 overflow-hidden">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-secondary/50 mb-3 flex items-center justify-center">
          <span className="text-4xl opacity-50">🍽️</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {item.isVeg ? (
            <div className="w-5 h-5 rounded border-2 border-success flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded border-2 border-destructive flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            </div>
          )}
          <h3 className="font-semibold text-lg">{item.name}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-5 h-5 text-primary" />
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono-price text-xl font-bold text-primary">
          ₹{item.price.toFixed(0)}
        </span>
        {item.preparationTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {item.preparationTime} min
          </div>
        )}
      </div>

      {!item.isAvailable && (
        <Badge variant="secondary" className="mt-2">
          Unavailable
        </Badge>
      )}

      {item.addOns.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          +{item.addOns.length} add-ons available
        </p>
      )}
    </button>
  );
}

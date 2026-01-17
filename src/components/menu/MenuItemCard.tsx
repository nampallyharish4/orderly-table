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
        className={cn(
          'w-full p-3 rounded-lg border border-border text-left transition-all',
          'hover:border-primary/50 hover:bg-secondary/50 active:scale-[0.98]',
          !item.isAvailable && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {item.isVeg ? (
              <Leaf className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <CircleDot className="w-4 h-4 text-destructive flex-shrink-0" />
            )}
            <span className="font-medium truncate">{item.name}</span>
          </div>
          <span className="font-mono-price font-semibold text-primary flex-shrink-0">
            ${item.price.toFixed(2)}
          </span>
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
          ${item.price.toFixed(2)}
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

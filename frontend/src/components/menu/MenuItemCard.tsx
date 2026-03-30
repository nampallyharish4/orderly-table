import { cn } from '@/lib/utils';
import { MenuItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock } from 'lucide-react';
import { getMenuItemImage } from '@/utils/menuImages';
import { CachedMenuImage } from './CachedMenuImage';

interface MenuItemCardProps {
  item: MenuItem;
  onClick?: () => void;
  compact?: boolean;
}

export function MenuItemCard({ item, onClick, compact }: MenuItemCardProps) {
  const imageUrl = item.imageUrl || getMenuItemImage(item.name);

  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={!item.isAvailable}
        data-testid={`menu-item-${item.id}`}
        className={cn(
          'w-full rounded-xl text-left transition-all group',
          'hover:shadow-lg active:scale-[0.97]',
          'bg-card shadow-sm overflow-hidden',
          !item.isAvailable && 'opacity-50 cursor-not-allowed grayscale-[0.3]',
        )}
      >
        {/* Image on top */}
        {imageUrl ? (
          <div className="w-full aspect-[16/10] overflow-hidden bg-secondary">
            <CachedMenuImage
              src={imageUrl}
              alt={item.name}
              cacheKey={`${item.id || item.name}:${imageUrl}`}
              width={480}
              height={300}
              quality={60}
              loading="lazy"
              fetchPriority="auto"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/10] bg-secondary/50 flex items-center justify-center">
            <span className="text-3xl opacity-40">🍽️</span>
          </div>
        )}
        {/* Content below image */}
        <div className="p-2.5 sm:p-3 space-y-1.5">
          <div className="flex items-start gap-1.5">
            {item.isVeg ? (
              <div className="w-4 h-4 rounded border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
            <span className="font-bold text-[13px] sm:text-sm md:text-base text-foreground leading-snug whitespace-normal break-words">
              {item.name}
            </span>
          </div>
          {item.description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
          <span className="font-mono-price text-base sm:text-lg font-extrabold text-primary block">
            ₹{item.price.toFixed(0)}
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
        !item.isAvailable && 'opacity-50 cursor-not-allowed',
      )}
    >
      {imageUrl ? (
        <div className="aspect-video rounded-lg bg-secondary mb-3 overflow-hidden">
          <CachedMenuImage
            src={imageUrl}
            alt={item.name}
            cacheKey={`${item.id || item.name}:${imageUrl}`}
            width={640}
            height={360}
            quality={60}
            loading="lazy"
            fetchPriority="auto"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-secondary/50 mb-3 flex items-center justify-center">
          <span className="text-4xl opacity-50"></span>
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

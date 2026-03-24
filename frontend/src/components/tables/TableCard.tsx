import { cn } from '@/lib/utils';
import { Table } from '@/types';
import { Users, Sparkles } from 'lucide-react';
import tableImage4 from '@/assets/4_SEATER.png';
import tableImage6 from '@/assets/6_SEATER.png';

interface TableCardProps {
  table: Table & { size?: string };
  onClick?: () => void;
  selected?: boolean;
  showOrder?: boolean;
  creatorName?: string;
}

export function TableCard({ table, onClick, selected, showOrder, creatorName }: TableCardProps) {
  const isAvailable = table.status === 'available';
  const isOccupied = table.status === 'occupied';

  const floor = (table.floor || '').toLowerCase();
  const num = (table.tableNumber || '').toUpperCase();
  
  // Decide table type heuristics
  let shape: 'rectangular' | 'oval' | 'square' = 'square';
  if (floor.includes('large') || (num.startsWith('T') && table.capacity >= 6) || table.capacity >= 6) {
    shape = 'rectangular';
  } else if (floor.includes('family') || num.startsWith('F') || (table.capacity === 4 && floor.includes('family'))) {
    shape = 'oval';
  } else {
    shape = 'square';
  }

  const currentTableImage = shape === 'rectangular' ? tableImage6 : tableImage4;

  // Always fit the parent container completely to support arbitrary floorplan placements
  let containerDimensions = "w-full h-full min-h-[50px]";
  let imageDimensions = "w-full h-full object-contain"; 

  return (
    <div className="flex flex-col items-center justify-center w-full h-full group/card relative">
      <button
        onClick={onClick}
        data-testid={`table-${table.tableNumber}`}
        className={cn(
          "group relative flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-[0.98]",
          containerDimensions,
          !onClick && "cursor-default"
        )}
      >
        {/* Table Image Container */}
        <div className={cn(
          "relative flex items-center justify-center w-full h-full",
          selected && "scale-[1.05]"
        )}>
          {/* User's Transparent PNG Table */}
          <img 
            src={currentTableImage} 
            alt="Table Layout" 
            className={cn(
              "absolute inset-0 m-auto select-none pointer-events-none transition-transform duration-300",
              imageDimensions
            )}
          />

          {/* Table Labels Overlaid Context */}
          <div className="relative z-10 flex flex-col items-center justify-center bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
             <span className="font-extrabold text-lg sm:text-xl text-white tracking-widest drop-shadow-md">
               {table.tableNumber}
             </span>
             <div className="flex items-center gap-1 opacity-90 text-zinc-200 text-[10px] sm:text-xs">
               <Users className="w-3 h-3" />
               <span>{table.capacity}</span>
             </div>
          </div>

          {/* Available Sparkle Overlaid */}
          {isAvailable && (
            <div className="absolute top-2 right-2 z-20">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            </div>
          )}

          {/* Status indicator pill absolute overlay at bottom */}
          <div className="absolute bottom-1 z-20">
            {isAvailable ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border border-emerald-500/50 text-emerald-400 bg-black/80 backdrop-blur-sm shadow-lg uppercase tracking-tight">
                Available
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border border-red-500/50 text-red-400 bg-black/80 backdrop-blur-sm shadow-lg uppercase tracking-tight">
                Occupied
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Info labels underneath (only for additional info if needed) */}
      <div className="flex flex-col items-center gap-0.5 mt-0.5">
        {isOccupied && showOrder && table.currentOrderIds.length > 0 && (
           <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 opacity-80 mt-0.5">
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             {table.currentOrderIds.length} Order{table.currentOrderIds.length > 1 ? 's' : ''}
           </span>
         )}
         
         {isOccupied && creatorName && (
           <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] opacity-80">
             By: {creatorName}
           </span>
         )}
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from "@/lib/utils";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function CustomSwitch({ 
  checked, 
  onCheckedChange, 
  className, 
  disabled,
  'data-testid': testId 
}: CustomSwitchProps) {
  return (
    <label 
      className={cn(
        "relative inline-block w-20 h-10 transition-opacity",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
        className
      )}
      data-testid={testId}
    >
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={checked} 
        onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={cn(
        "absolute top-0 left-0 w-full h-full rounded-full transition-colors duration-300 ease-in-out",
        checked 
          ? "bg-[#05c46b] shadow-[inset_0_0_0_2px_#04b360]" 
          : "bg-[#ddd] dark:bg-slate-700 shadow-[inset_0_0_0_2px_#ccc] dark:shadow-[inset_0_0_0_2px_#555]"
      )}>
        <div className={cn(
          "absolute top-[5px] left-[5px] w-[30px] h-[30px] bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out",
          checked ? "translate-x-[40px]" : "translate-x-0"
        )} />
      </div>
    </label>
  );
}

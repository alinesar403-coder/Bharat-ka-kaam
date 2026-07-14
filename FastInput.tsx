import React, { useState, useEffect, useRef, useTransition } from 'react';

interface FastInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}

export const FastInput = React.forwardRef<HTMLInputElement, FastInputProps>(
  ({ value, onChange, icon, className, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const [, startTransition] = useTransition();
    const lastValueRef = useRef(value);

    // Keep local value in sync with external value changes
    useEffect(() => {
      if (value !== lastValueRef.current) {
        setLocalValue(value);
        lastValueRef.current = value;
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      lastValueRef.current = val;
      
      // Use concurrent features to avoid blocking input typing
      startTransition(() => {
        onChange(val);
      });
    };

    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm flex items-center justify-center select-none pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          value={localValue}
          onChange={handleChange}
          className={className}
          {...props}
        />
      </div>
    );
  }
);

FastInput.displayName = 'FastInput';

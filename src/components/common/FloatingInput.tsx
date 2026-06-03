'use client';

import React, { useState } from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput = ({ label, value, onFocus, onBlur, ...props }: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div className="relative w-full group">
      <input
        {...props}
        value={value}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        className={`
          peer w-full border border-slate-100 p-4 pt-7 pb-2 rounded-xl text-xs font-bold bg-slate-50/50 
          focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all placeholder-transparent
          ${props.className || ''}
        `}
      />
      <label
        className={`
          absolute left-4 transition-all pointer-events-none  capitalize 
          ${(isFocused || hasValue) 
            ? 'top-2 text-[9px] text-blue-600' 
            : 'top-1/2 -translate-y-1/2 text-xs text-slate-400'}
        `}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;

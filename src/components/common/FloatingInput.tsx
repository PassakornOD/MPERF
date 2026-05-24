'use client';

import React, { useState } from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FloatingInput = ({ label, value, onFocus, onBlur, ...props }: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div className="relative w-full">
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
          peer w-full border border-gray-100 p-3 pt-5 pb-1 rounded-lg text-xs font-bold bg-gray-50 
          focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-transparent
          ${props.className || ''}
        `}
      />
      <label
        className={`
          absolute left-4 transition-all pointer-events-none font-bold capitalize tracking-normal
          ${(isFocused || hasValue) 
            ? 'top-1 text-[8px] text-blue-600' 
            : 'top-1/2 -translate-y-1/2 text-[10px] text-gray-400'}
        `}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;

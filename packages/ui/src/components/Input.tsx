import React from 'react';
export interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text'|'email'|'password'|'number';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export const Input: React.FC<InputProps> = ({ value, onChange, placeholder, type='text', disabled=false, className='', style }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e)=>onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={style}
    />
  );
};

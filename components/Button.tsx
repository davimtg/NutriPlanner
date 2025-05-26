
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out inline-flex items-center justify-center';
  
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400 border border-gray-300';
      break;
  }

  let sizeStyles = '';
  switch (size) {
    case 'sm':
      sizeStyles = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyles = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyles = 'px-6 py-3 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;

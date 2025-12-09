import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'warning';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyle = "font-mono font-bold py-3 px-6 border-2 uppercase tracking-wider transition-all duration-200 focus:outline-none relative overflow-hidden group";
  
  const variants = {
    primary: "border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_20px_rgba(0,255,0,0.6)]",
    danger: "border-alert-red text-alert-red hover:bg-alert-red hover:text-black shadow-[0_0_10px_rgba(255,50,50,0.3)] hover:shadow-[0_0_20px_rgba(255,50,50,0.6)]",
    secondary: "border-gray-500 text-gray-400 hover:border-gray-300 hover:text-gray-200",
    warning: "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black shadow-[0_0_10px_rgba(250,204,21,0.3)] hover:shadow-[0_0_20px_rgba(250,204,21,0.6)]",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"></div>
    </button>
  );
};
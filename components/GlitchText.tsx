import React from 'react';

interface GlitchTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  active?: boolean;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, as: Tag = 'span', className = '', active = true }) => {
  return (
    <Tag className={`relative inline-block ${className} ${active ? 'group' : ''}`}>
      <span className="relative z-10">{text}</span>
      {active && (
        <>
          <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-70 animate-glitch overflow-hidden clip-path-inset" aria-hidden="true">
            {text}
          </span>
          <span className="absolute top-0 left-0 ml-[2px] text-blue-500 opacity-70 animate-glitch animation-delay-200 overflow-hidden clip-path-inset" aria-hidden="true">
            {text}
          </span>
        </>
      )}
    </Tag>
  );
};

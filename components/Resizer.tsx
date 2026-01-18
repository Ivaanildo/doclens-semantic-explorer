
import React from 'react';

interface ResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  orientation?: 'vertical' | 'horizontal';
}

const Resizer: React.FC<ResizerProps> = ({ onMouseDown, orientation = 'vertical' }) => {
  return (
    <div
      className={`
        flex items-center justify-center bg-transparent group z-40 select-none
        ${orientation === 'vertical' ? 'w-1 cursor-col-resize px-1' : 'h-1 cursor-row-resize py-1'}
      `}
      onMouseDown={onMouseDown}
    >
      <div className={`
        bg-slate-200 transition-all duration-300 rounded-full group-hover:bg-blue-400
        ${orientation === 'vertical' ? 'w-0.5 h-12 group-hover:h-24' : 'h-0.5 w-12 group-hover:w-24'}
      `} />
    </div>
  );
};

export default Resizer;

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children, ...props }: { children: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ render }: { render: (props: any) => React.ReactNode }) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipTrigger must be used within Tooltip');

  const { setOpen, triggerRef } = context;

  const onMouseEnter = () => setOpen(true);
  const onMouseLeave = () => setOpen(false);
  const onFocus = () => setOpen(true);
  const onBlur = () => setOpen(false);

  const ref = (node: HTMLElement | null) => {
    (triggerRef as any).current = node;
  };

  return render({
    ref,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  });
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function TooltipContent({
  children,
  side = 'top',
  align = 'center',
  className = '',
}: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error('TooltipContent must be used within Tooltip');

  const { open, triggerRef } = context;
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let top = 0;
      let left = 0;

      if (side === 'top') {
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + rect.width / 2;
      } else if (side === 'bottom') {
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2;
      } else if (side === 'left') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 8;
      } else if (side === 'right') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 8;
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, triggerRef, side, align]);

  const getMotionProps = () => {
    if (side === 'top') {
      return {
        initial: { opacity: 0, scale: 0.95, y: 4, x: '-50%' },
        animate: { opacity: 1, scale: 1, y: -10, x: '-50%' },
        exit: { opacity: 0, scale: 0.95, y: 4, x: '-50%' },
      };
    }
    if (side === 'bottom') {
      return {
        initial: { opacity: 0, scale: 0.95, y: -4, x: '-50%' },
        animate: { opacity: 1, scale: 1, y: 0, x: '-50%' },
        exit: { opacity: 0, scale: 0.95, y: -4, x: '-50%' },
      };
    }
    if (side === 'left') {
      return {
        initial: { opacity: 0, scale: 0.95, x: 4, y: '-50%' },
        animate: { opacity: 1, scale: 1, x: -10, y: '-50%' },
        exit: { opacity: 0, scale: 0.95, x: 4, y: '-50%' },
      };
    }
    return {
      initial: { opacity: 0, scale: 0.95, x: -4, y: '-50%' },
      animate: { opacity: 1, scale: 1, x: 0, y: '-50%' },
      exit: { opacity: 0, scale: 0.95, x: -4, y: '-50%' },
    };
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...getMotionProps()}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className={`px-3 py-1.5 text-xs font-medium text-white bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-lg shadow-xl ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

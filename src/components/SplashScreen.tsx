import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimatedLogo } from './common/AnimatedLogo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    // The animation takes around 3.5 to 4 seconds to complete. 
    // We'll give it 4 seconds before triggering the exit.
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[450px] md:h-[450px]">
        <AnimatedLogo className="w-full h-full drop-shadow-2xl" />
      </div>
    </motion.div>
  );
};

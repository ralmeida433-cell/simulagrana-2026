import React from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt = "Avatar", size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={cn(
      "rounded-full p-[2px] bg-primary shrink-0", 
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover bg-background border border-background"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border border-background">
          <User className={cn("text-muted-foreground", size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : size === 'xl' ? 'w-12 h-12' : 'w-5 h-5')} />
        </div>
      )}
    </div>
  );
}

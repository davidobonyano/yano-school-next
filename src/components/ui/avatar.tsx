import React from 'react';
import Image from 'next/image';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  className?: string;
}

export const Avatar = ({ 
  className = '',
  src,
  alt = '', // Default empty alt for decorative images
  children,
  ...props 
}: AvatarProps) => (
  <div 
    className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
    {...props}
  >
    {src && (
      <Image
        src={src}
        alt={alt}
        fill
        className="aspect-square h-full w-full object-cover"
        unoptimized={true}
      />
    )}
    {children}
  </div>
);

interface AvatarImageProps extends React.ComponentProps<typeof Image> {
  className?: string;
  alt: string; // Making alt required for AvatarImage
}

export const AvatarImage = ({ 
  className = '',
  alt, // Required alt prop
  ...props 
}: AvatarImageProps) => (
  <Image
    {...props}
    alt={alt}
    fill
    className={`aspect-square h-full w-full object-cover ${className}`}
    unoptimized={true}
  />
);

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export const AvatarFallback = ({ 
  className = '',
  ...props 
}: AvatarFallbackProps) => (
  <span 
    className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}
    {...props}
  />
);
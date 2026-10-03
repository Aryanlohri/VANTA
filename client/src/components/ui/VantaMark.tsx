'use client';

import { useId, useState, useEffect, useRef } from 'react';

interface VantaMarkProps {
  size?: number;
  className?: string;
}

export function VantaMark({ size = 28, className = '' }: VantaMarkProps) {
  const gradientId = useId();
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setShouldAnimate(false);
      return;
    }

    // Pause when offscreen or tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        setShouldAnimate(false);
      } else {
        // Re-check intersection
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          setShouldAnimate(isVisible);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShouldAnimate(entry.isIntersecting && !document.hidden);
        });
      },
      { threshold: 0 }
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="24"
          spreadMethod="reflect"
          gradientTransform="rotate(30, 12, 12)"
        >
          <stop offset="0" stopColor="#f5f5f5" />
          <stop offset="0.35" stopColor="#7a7a7a" />
          <stop offset="0.6" stopColor="#e6e6e6" />
          <stop offset="1" stopColor="#5c5c5c" />
          {shouldAnimate && (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 0"
              to="0 -48"
              dur="7s"
              repeatCount="indefinite"
              additive="sum"
            />
          )}
        </linearGradient>
      </defs>
      {/* Clean SVG polygon for 'V' */}
      <polygon
        points="2,2 12,22 22,2 17,2 12,12 7,2"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

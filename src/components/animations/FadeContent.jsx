import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function FadeContent({
  children,
  blur = false,
  duration = 1000,
  ease = "power2.out",
  initialOpacity = 0,
  delay = 0,
  className = "",
  style = {}
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Set initial state
    gsap.set(el, {
      opacity: initialOpacity,
      filter: blur ? 'blur(10px)' : 'none'
    });

    // Animate
    gsap.to(el, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: duration / 1000,
      ease: ease,
      delay: delay / 1000
    });
  }, [blur, duration, ease, initialOpacity, delay]);

  return (
    <div ref={elementRef} className={className} style={style}>
      {children}
    </div>
  );
}

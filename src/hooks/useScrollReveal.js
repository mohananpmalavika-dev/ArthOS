import { useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('scroll-revealed');
        observer.unobserve(element);
      }
    }, defaultOptions);

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [defaultOptions]);

  return ref;
}

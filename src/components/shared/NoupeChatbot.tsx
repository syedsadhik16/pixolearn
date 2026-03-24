import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ALLOWED_PATHS = ['/', '/student', '/pricing', '/support'];
const SCRIPT_ID = 'noupe-chatbot-script';
const SCRIPT_SRC = 'https://www.noupe.com/embed/019d214f22aa7a6a9d27499eb778714a04ea.js';

export function NoupeChatbot() {
  const location = useLocation();
  const injectedRef = useRef(false);

  const isAllowed = ALLOWED_PATHS.includes(location.pathname);

  useEffect(() => {
    if (!isAllowed) {
      // Hide chatbot widget if it exists when on blocked pages
      const widget = document.querySelector('[data-noupe-widget]') as HTMLElement
        ?? document.querySelector('iframe[src*="noupe"]')?.parentElement as HTMLElement;
      if (widget) widget.style.display = 'none';
      return () => {
        if (widget) widget.style.display = '';
      };
    }

    // Show widget if already injected
    const existingWidget = document.querySelector('[data-noupe-widget]') as HTMLElement
      ?? document.querySelector('iframe[src*="noupe"]')?.parentElement as HTMLElement;
    if (existingWidget) {
      existingWidget.style.display = '';
    }

    // Prevent duplicate injection
    if (injectedRef.current || document.getElementById(SCRIPT_ID)) {
      injectedRef.current = true;
      return;
    }

    // Lazy load after main app renders
    const loadScript = () => {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      injectedRef.current = true;
    };

    // Defer loading to after window load to avoid blocking FCP/LCP
    if (document.readyState === 'complete') {
      const timer = setTimeout(loadScript, 1500);
      return () => clearTimeout(timer);
    } else {
      const handleLoad = () => {
        setTimeout(loadScript, 1500);
      };
      window.addEventListener('load', handleLoad, { once: true });
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [isAllowed, location.pathname]);

  return null;
}

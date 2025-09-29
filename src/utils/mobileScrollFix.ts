/**
 * Mobile Scroll Fix Utility
 * Comprehensive solution for Android and iOS scroll issues
 */

export class MobileScrollFix {
  private static instance: MobileScrollFix;
  private startY = 0;
  private startX = 0;
  private isScrolling = false;
  private preventPullToRefresh = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): MobileScrollFix {
    if (!MobileScrollFix.instance) {
      MobileScrollFix.instance = new MobileScrollFix();
    }
    return MobileScrollFix.instance;
  }

  private init(): void {
    // Only initialize on mobile devices
    if (this.isMobileDevice()) {
      this.setupEventListeners();
      this.setupCSS();
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  private setupEventListeners(): void {
    // Prevent pull-to-refresh
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

    // Prevent overscroll bounce
    document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.startY = e.touches[0].clientY;
      this.startX = e.touches[0].clientX;
      this.isScrolling = false;
      
      // Check if we're at the top of the page
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      this.preventPullToRefresh = scrollTop === 0;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.preventPullToRefresh) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - this.startY;
      const deltaX = currentX - this.startX;

      // Determine if this is a vertical scroll
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.isScrolling = true;
        
        // Prevent pull-to-refresh when scrolling up at the top
        if (deltaY > 0 && this.preventPullToRefresh) {
          e.preventDefault();
          return;
        }
      }
    }
  }

  private handleTouchEnd(): void {
    this.preventPullToRefresh = false;
    this.isScrolling = false;
  }

  private handleScroll(): void {
    // Additional scroll handling if needed
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    // Update body class for scroll position
    if (scrollTop > 0) {
      document.body.classList.add('is-scrolled');
    } else {
      document.body.classList.remove('is-scrolled');
    }
  }

  private setupCSS(): void {
    // Inject critical CSS for mobile scroll fixes
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile scroll fixes */
      @media (max-width: 768px) {
        html {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: none;
          touch-action: pan-y;
        }
        
        body {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: none;
          touch-action: pan-y;
        }
        
        /* Disable iOS bounce */
        body.is-scrolled {
          position: fixed;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
        /* Fix for Android Chrome pull-to-refresh */
        .main-content {
          overscroll-behavior-y: none;
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    
    if (!document.querySelector('#mobile-scroll-fix')) {
      style.id = 'mobile-scroll-fix';
      document.head.appendChild(style);
    }
  }

  /**
   * Enable smooth scrolling for an element
   */
  public enableSmoothScroll(element: HTMLElement): void {
    element.style.webkitOverflowScrolling = 'touch';
    element.style.overscrollBehavior = 'none';
  }

  /**
   * Disable pull-to-refresh for a specific element
   */
  public disablePullToRefresh(element: HTMLElement): void {
    element.style.overscrollBehaviorY = 'none';
    element.style.touchAction = 'pan-y';
  }

  /**
   * Setup scroll container with mobile optimizations
   */
  public setupScrollContainer(element: HTMLElement): void {
    this.enableSmoothScroll(element);
    this.disablePullToRefresh(element);
    
    // Add mobile-friendly scroll behavior
    element.addEventListener('touchstart', (e) => {
      // Store initial touch position
      element.dataset.touchStartY = e.touches[0].clientY.toString();
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
      const startY = parseFloat(element.dataset.touchStartY || '0');
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Prevent overscroll at boundaries
      if (element.scrollTop === 0 && deltaY > 0) {
        e.preventDefault();
      } else if (
        element.scrollTop >= element.scrollHeight - element.clientHeight && 
        deltaY < 0
      ) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    
    const style = document.querySelector('#mobile-scroll-fix');
    if (style) {
      style.remove();
    }
  }
}

// Initialize the mobile scroll fix
export const initMobileScrollFix = (): MobileScrollFix => {
  return MobileScrollFix.getInstance();
};

// Export for use in components
export default MobileScrollFix;

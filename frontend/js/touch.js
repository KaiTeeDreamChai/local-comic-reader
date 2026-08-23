/**
 * Ultra-Responsive Touch, Pinch-to-Zoom and Gesture Controller for Mobile / Android Chrome
 */
class TouchController {
  constructor(element, options = {}) {
    this.el = element;
    this.onSwipeLeft = options.onSwipeLeft || (() => {});
    this.onSwipeRight = options.onSwipeRight || (() => {});
    this.onDoubleTap = options.onDoubleTap || (() => {});
    this.onTap = options.onTap || (() => {});
    this.onZoomChange = options.onZoomChange || (() => {});

    this.scale = 1;
    this.baseScale = 1;
    this.minScale = 1;
    this.maxScale = 4.0;
    this.translateX = 0;
    this.translateY = 0;

    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.initialDistance = 0;
    this.isDragging = false;
    this.isPinching = false;
    this.lastTapTime = 0;
    this.tapTimeout = null;

    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchEnd.bind(this);

    this.init();
  }

  init() {
    // Note: { passive: false } is mandatory to allow e.preventDefault() for pinch-zoom on Chrome
    this.el.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.el.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.el.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    this.el.addEventListener('touchcancel', this.boundTouchCancel, { passive: false });
  }

  getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Two-finger pinch start
      e.preventDefault();
      this.isPinching = true;
      this.isDragging = false;
      this.baseScale = this.scale;
      this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      this.isPinching = false;
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.isDragging = this.scale > 1.05;
    }
  }

  handleTouchMove(e) {
    if (this.isPinching && e.touches.length >= 2) {
      e.preventDefault();
      const currentDist = this.getDistance(e.touches[0], e.touches[1]);
      if (this.initialDistance > 0) {
        const ratio = currentDist / this.initialDistance;
        let newScale = this.baseScale * ratio;
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        this.scale = newScale;
        this.updateTransform();
        this.onZoomChange(this.scale);
      }
    } else if (e.touches.length === 1) {
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;

      if (this.scale > 1.05) {
        // Drag / Pan when zoomed in
        e.preventDefault();
        const dx = this.currentX - this.startX;
        const dy = this.currentY - this.startY;
        this.translateX += dx;
        this.translateY += dy;
        this.startX = this.currentX;
        this.startY = this.currentY;
        this.updateTransform();
      }
    }
  }

  handleTouchEnd(e) {
    if (this.isPinching) {
      if (e.touches.length < 2) {
        this.isPinching = false;
        if (this.scale <= 1.08) {
          this.resetZoom();
        } else if (e.touches.length === 1) {
          this.startX = e.touches[0].clientX;
          this.startY = e.touches[0].clientY;
          this.currentX = this.startX;
          this.currentY = this.startY;
        }
      }
      return;
    }

    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = this.currentX - this.startX;
      const deltaY = this.currentY - this.startY;
      const dist = Math.hypot(deltaX, deltaY);
      const now = Date.now();

      // Tap handling if hardly moved (< 12px)
      if (dist < 12) {
        if (now - this.lastTapTime < 300) {
          // Double Tap: Zoom in / Reset
          clearTimeout(this.tapTimeout);
          this.lastTapTime = 0;
          this.handleDoubleTap(touch.clientX, touch.clientY);
        } else {
          this.lastTapTime = now;
          this.tapTimeout = setTimeout(() => {
            this.onTap({ x: touch.clientX, y: touch.clientY });
          }, 240);
        }
      } else if (this.scale <= 1.05) {
        // Horizontal Swipe in unzoomed state
        const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
        if (dist > 40 && (angle < 35 || angle > 145)) {
          if (deltaX < 0) {
            this.onSwipeLeft();
          } else {
            this.onSwipeRight();
          }
        }
      }
    }
  }

  handleDoubleTap(x, y) {
    if (this.scale > 1.2) {
      this.resetZoom();
    } else {
      this.scale = 2.2;
      this.translateX = 0;
      this.translateY = 0;
      this.updateTransform();
      this.onZoomChange(this.scale);
    }
    this.onDoubleTap(this.scale);
  }

  resetZoom() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
    this.onZoomChange(1);
  }

  updateTransform() {
    const target = this.el.querySelector('.reader-image-container');
    if (target) {
      target.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0) scale(${this.scale})`;
    }
  }

  destroy() {
    this.el.removeEventListener('touchstart', this.boundTouchStart);
    this.el.removeEventListener('touchmove', this.boundTouchMove);
    this.el.removeEventListener('touchend', this.boundTouchEnd);
    this.el.removeEventListener('touchcancel', this.boundTouchCancel);
  }
}

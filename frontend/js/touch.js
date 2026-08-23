/**
 * Touch and Gesture Handler for Comic Reader
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
    this.minScale = 1;
    this.maxScale = 3.5;
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

    this.init();
  }

  init() {
    this.el.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.el.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.el.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.el.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch to zoom start
      e.preventDefault();
      this.isPinching = true;
      this.isDragging = false;
      this.initialDistance = this.getDistance(e.touches);
    } else if (e.touches.length === 1) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.isDragging = this.scale > 1; // only drag if zoomed in
    }
  }

  handleTouchMove(e) {
    if (this.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDist = this.getDistance(e.touches);
      const ratio = currentDist / (this.initialDistance || 1);
      let newScale = this.scale * ratio;
      newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
      
      this.scale = newScale;
      this.initialDistance = currentDist;
      this.updateTransform();
      this.onZoomChange(this.scale);
    } else if (e.touches.length === 1) {
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;

      if (this.scale > 1 && this.isDragging) {
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
        if (this.scale <= 1.05) {
          this.resetZoom();
        }
      }
      return;
    }

    if (e.changedTouches.length === 1) {
      const deltaX = this.currentX - this.startX;
      const deltaY = this.currentY - this.startY;
      const dist = Math.hypot(deltaX, deltaY);
      const now = Date.now();

      // Tap handling if hardly moved
      if (dist < 10) {
        if (now - this.lastTapTime < 300) {
          // Double Tap
          clearTimeout(this.tapTimeout);
          this.lastTapTime = 0;
          this.handleDoubleTap(this.startX, this.startY);
        } else {
          this.lastTapTime = now;
          this.tapTimeout = setTimeout(() => {
            this.onTap({ x: this.startX, y: this.startY });
          }, 300);
        }
      } else if (this.scale === 1) {
        // Horizontal Swipe in unzoomed state
        const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
        if (dist > 45 && (angle < 30 || angle > 150)) {
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
      target.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

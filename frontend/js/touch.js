/**
 * Modern Multi-Touch & Pointer Gesture Controller
 * Engineered specifically for Android 14/15/16 Chrome, Mobile Safari & Desktop
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

    // Track active pointer events (for PointerEvent API)
    this.activePointers = new Map();

    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundPointerCancel = this.handlePointerCancel.bind(this);

    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);

    this.init();
  }

  init() {
    // If PointerEvent is supported (Modern Android Chrome & Chromium)
    if (window.PointerEvent) {
      this.el.addEventListener('pointerdown', this.boundPointerDown, { passive: false });
      this.el.addEventListener('pointermove', this.boundPointerMove, { passive: false });
      this.el.addEventListener('pointerup', this.boundPointerUp, { passive: false });
      this.el.addEventListener('pointercancel', this.boundPointerCancel, { passive: false });
      this.el.addEventListener('pointerleave', this.boundPointerCancel, { passive: false });
    } else {
      // Fallback to TouchEvents
      this.el.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      this.el.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      this.el.addEventListener('touchend', this.boundTouchEnd, { passive: false });
      this.el.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });
    }
  }

  getPointerDistance(p1, p2) {
    return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
  }

  // --- Pointer Events Handling ---
  handlePointerDown(e) {
    this.activePointers.set(e.pointerId, e);

    if (this.activePointers.size === 2) {
      // 2 fingers pinch start
      this.isPinching = true;
      this.isDragging = false;
      this.baseScale = this.scale;
      const pts = Array.from(this.activePointers.values());
      this.initialDistance = this.getPointerDistance(pts[0], pts[1]);
    } else if (this.activePointers.size === 1) {
      this.isPinching = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.currentX = this.startX;
      this.currentY = this.startY;
      this.isDragging = this.scale > 1.05;
    }
  }

  handlePointerMove(e) {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.set(e.pointerId, e);

    if (this.isPinching && this.activePointers.size >= 2) {
      e.preventDefault();
      const pts = Array.from(this.activePointers.values());
      const currentDist = this.getPointerDistance(pts[0], pts[1]);
      if (this.initialDistance > 0) {
        const ratio = currentDist / this.initialDistance;
        let newScale = this.baseScale * ratio;
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        this.scale = newScale;
        this.updateTransform();
        this.onZoomChange(this.scale);
      }
    } else if (this.activePointers.size === 1) {
      this.currentX = e.clientX;
      this.currentY = e.clientY;

      if (this.scale > 1.05) {
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

  handlePointerUp(e) {
    this.activePointers.delete(e.pointerId);

    if (this.isPinching) {
      if (this.activePointers.size < 2) {
        this.isPinching = false;
        if (this.scale <= 1.08) {
          this.resetZoom();
        } else if (this.activePointers.size === 1) {
          const remaining = Array.from(this.activePointers.values())[0];
          this.startX = remaining.clientX;
          this.startY = remaining.clientY;
          this.currentX = this.startX;
          this.currentY = this.startY;
        }
      }
      return;
    }

    if (this.activePointers.size === 0) {
      const deltaX = this.currentX - this.startX;
      const deltaY = this.currentY - this.startY;
      const dist = Math.hypot(deltaX, deltaY);
      const now = Date.now();

      if (dist < 15) {
        // Tap detected
        if (now - this.lastTapTime < 300) {
          clearTimeout(this.tapTimeout);
          this.lastTapTime = 0;
          this.handleDoubleTap(this.startX, this.startY);
        } else {
          this.lastTapTime = now;
          this.tapTimeout = setTimeout(() => {
            this.onTap({ x: this.startX, y: this.startY });
          }, 240);
        }
      } else if (this.scale <= 1.05) {
        // Swipe detected
        const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
        if (dist > 45 && (angle < 35 || angle > 145)) {
          if (deltaX < 0) {
            this.onSwipeLeft();
          } else {
            this.onSwipeRight();
          }
        }
      }
    }
  }

  handlePointerCancel(e) {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size === 0) {
      this.isPinching = false;
      this.isDragging = false;
    }
  }

  // --- Fallback Touch Events Handling ---
  handleTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.isPinching = true;
      this.isDragging = false;
      this.baseScale = this.scale;
      this.initialDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
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
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (this.initialDistance > 0) {
        const ratio = currentDist / this.initialDistance;
        let newScale = this.baseScale * ratio;
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        this.scale = newScale;
        this.updateTransform();
        this.onZoomChange(this.scale);
      }
    } else if (e.touches.length === 1 && this.scale > 1.05) {
      e.preventDefault();
      this.currentX = e.touches[0].clientX;
      this.currentY = e.touches[0].clientY;
      const dx = this.currentX - this.startX;
      const dy = this.currentY - this.startY;
      this.translateX += dx;
      this.translateY += dy;
      this.startX = this.currentX;
      this.startY = this.currentY;
      this.updateTransform();
    }
  }

  handleTouchEnd(e) {
    if (this.isPinching) {
      if (e.touches.length < 2) {
        this.isPinching = false;
        if (this.scale <= 1.08) {
          this.resetZoom();
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

      if (dist < 15) {
        if (now - this.lastTapTime < 300) {
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
        const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
        if (dist > 45 && (angle < 35 || angle > 145)) {
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
    if (window.PointerEvent) {
      this.el.removeEventListener('pointerdown', this.boundPointerDown);
      this.el.removeEventListener('pointermove', this.boundPointerMove);
      this.el.removeEventListener('pointerup', this.boundPointerUp);
      this.el.removeEventListener('pointercancel', this.boundPointerCancel);
      this.el.removeEventListener('pointerleave', this.boundPointerCancel);
    }
    this.el.removeEventListener('touchstart', this.boundTouchStart);
    this.el.removeEventListener('touchmove', this.boundTouchMove);
    this.el.removeEventListener('touchend', this.boundTouchEnd);
    this.el.removeEventListener('touchcancel', this.boundTouchEnd);
  }
}

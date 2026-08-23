const { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

createApp({
  setup() {
    // Navigation State
    const viewMode = ref('library'); // 'library' | 'reader'
    const currentPath = ref('');
    const breadcrumbs = ref([]);
    const searchQuery = ref('');
    const loading = ref(false);
    const errorMsg = ref('');

    // Library Data
    const isRoot = ref(true);
    const bookshelves = ref([]);
    const currentDirectory = ref({ name: '', current_path: '', folders: [], comics: [] });
    const systemDrives = ref([]);

    // Modals State
    const showBookshelfModal = ref(false);
    const showInfoModal = ref(false);
    const showSettingsModal = ref(false);
    const newShelfPath = ref('');
    const newShelfName = ref('');
    const addingShelf = ref(false);

    // System / LAN Info
    const systemInfo = ref({ lan_urls: [], local_ips: [], port: 8000, platform: '' });

    // Reader State
    const currentComic = ref(null);
    const currentPageIndex = ref(0);
    const readingMode = ref('paged'); // 'paged' | 'scroll'
    const readingDirection = ref('ltr'); // 'ltr' (left to right) | 'rtl' (right to left)
    const pageSpread = ref(localStorage.getItem('comic_page_spread') || 'single'); // 'single' | 'double'
    const isWideOrLandscape = ref(false);
    const showHud = ref(true);
    const showThumbnailDrawer = ref(false);
    const isFullscreen = ref(false);
    const currentZoom = ref(1);
    const loadedPages = ref(new Set());
    const weakNetworkMode = ref(localStorage.getItem('comic_weak_net_mode') === 'true');

    let touchController = null;
    let hudTimer = null;

    // Detect Desktop or Mobile Landscape
    const updateScreenOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isDesktop = window.innerWidth >= 768;
      isWideOrLandscape.value = isLandscape || isDesktop;
    };

    const isDoublePage = computed(() => {
      return readingMode.value === 'paged' && isWideOrLandscape.value && pageSpread.value === 'double';
    });

    const currentPairIndex = computed(() => {
      if (!isDoublePage.value || !currentComic.value) return null;
      const p2 = currentPageIndex.value + 1;
      return p2 < currentComic.value.total_pages ? p2 : null;
    });

    const togglePageSpread = () => {
      pageSpread.value = pageSpread.value === 'single' ? 'double' : 'single';
      saveSettings();
      if (touchController) {
        touchController.resetZoom();
      }
      preloadPages();
    };

    // Toggle Weak Network Optimization Mode
    const toggleWeakNetworkMode = () => {
      weakNetworkMode.value = !weakNetworkMode.value;
      localStorage.setItem('comic_weak_net_mode', weakNetworkMode.value ? 'true' : 'false');
      loadedPages.value.clear();
      if (currentComic.value) {
        preloadPages();
      }
    };

    const getPageUrl = (pageIndex) => {
      if (!currentComic.value || !currentComic.value.pages || !currentComic.value.pages[pageIndex]) return '';
      const base = currentComic.value.pages[pageIndex].url;
      return weakNetworkMode.value ? `${base}&optimize=1` : base;
    };

    // Load App Settings from LocalStorage or Server
    const loadSettings = () => {
      const savedMode = localStorage.getItem('comic_reading_mode');
      if (savedMode) readingMode.value = savedMode;
      const savedDir = localStorage.getItem('comic_reading_dir');
      if (savedDir) readingDirection.value = savedDir;
      const savedSpread = localStorage.getItem('comic_page_spread');
      if (savedSpread) pageSpread.value = savedSpread;
    };

    const saveSettings = () => {
      localStorage.setItem('comic_reading_mode', readingMode.value);
      localStorage.setItem('comic_reading_dir', readingDirection.value);
      localStorage.setItem('comic_page_spread', pageSpread.value);
    };

    // Filtered Comics & Folders
    const filteredFolders = computed(() => {
      if (!searchQuery.value.trim()) return currentDirectory.value.folders || [];
      const q = searchQuery.value.toLowerCase();
      return (currentDirectory.value.folders || []).filter(f => f.name.toLowerCase().includes(q));
    });

    const filteredComics = computed(() => {
      if (!searchQuery.value.trim()) return currentDirectory.value.comics || [];
      const q = searchQuery.value.toLowerCase();
      return (currentDirectory.value.comics || []).filter(c => c.name.toLowerCase().includes(q));
    });

    // Fetch System Info
    const fetchSystemInfo = async () => {
      try {
        const res = await fetch('/api/info');
        if (res.ok) {
          systemInfo.value = await res.json();
        }
      } catch (e) {
        console.error('Failed to get system info:', e);
      }
    };

    // Fetch System Drives / Roots
    const fetchSystemDrives = async () => {
      try {
        const res = await fetch('/api/filesystem/drives');
        if (res.ok) {
          systemDrives.value = await res.json();
        }
      } catch (e) {
        console.error('Failed to load system drives:', e);
      }
    };

    // Navigation History Stack
    const navHistory = ref([]);
    const currentEncodedPath = ref('');

    // Load Library (Root or Subpath)
    const loadLibrary = async (encodedPath = '', isFromHistory = false) => {
      loading.value = true;
      errorMsg.value = '';
      try {
        if (!isFromHistory && currentEncodedPath.value !== encodedPath) {
          navHistory.value.push(currentEncodedPath.value);
          if (navHistory.value.length > 50) navHistory.value.shift();
        }

        const url = encodedPath ? `/api/library/browse?encoded_path=${encodedPath}` : '/api/library/browse';
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || '该目录不可用或路径无效');
        }

        currentEncodedPath.value = encodedPath;
        isRoot.value = !!data.is_root;
        if (data.is_root) {
          bookshelves.value = data.bookshelves || [];
          currentDirectory.value = { name: '书架首页', current_path: '', folders: [], comics: [] };
          currentPath.value = '';
          breadcrumbs.value = [{ name: '首页', encoded_path: '' }];
        } else {
          currentDirectory.value = data;
          currentPath.value = data.current_path;
          updateBreadcrumbs(data);
        }
      } catch (e) {
        errorMsg.value = e.message || '该目录不可用或已被移动/删除';
      } finally {
        loading.value = false;
      }
    };

    const updateBreadcrumbs = (data) => {
      const sep = data.current_path.includes('\\') ? '\\' : '/';
      const parts = data.current_path.split(sep).filter(Boolean);
      
      const crumbs = [{ name: '首页', encoded_path: '' }];
      let accumulated = '';
      
      parts.forEach((p, idx) => {
        if (sep === '/' && idx === 0 && !data.current_path.startsWith('/')) {
          accumulated = p;
        } else if (sep === '\\' && idx === 0) {
          accumulated = p + '\\';
        } else {
          accumulated = accumulated ? `${accumulated}${sep}${p}` : (sep === '/' ? `/${p}` : p);
        }
        crumbs.push({
          name: p,
          path: accumulated,
          encoded_path: btoa(unescape(encodeURIComponent(accumulated))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        });
      });

      breadcrumbs.value = crumbs;
    };

    const navigateToCrumb = (crumb) => {
      loadLibrary(crumb.encoded_path);
    };

    const openFolder = (folder) => {
      loadLibrary(folder.id);
    };

    // Bookshelf Management
    const handleAddBookshelf = async () => {
      if (!newShelfPath.value.trim()) return;
      addingShelf.value = true;
      errorMsg.value = '';
      try {
        const res = await fetch('/api/config/bookshelves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: newShelfPath.value.trim(),
            name: newShelfName.value.trim()
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || '添加失败');
        
        newShelfPath.value = '';
        newShelfName.value = '';
        showBookshelfModal.value = false;
        await loadLibrary();
      } catch (e) {
        alert(e.message);
      } finally {
        addingShelf.value = false;
      }
    };

    const handleDeleteBookshelf = async (shelfId) => {
      if (!confirm('确定要从书架中移除此文件夹吗？（不会删除电脑上的实际文件）')) return;
      try {
        const res = await fetch(`/api/config/bookshelves/${shelfId}`, { method: 'DELETE' });
        if (res.ok) {
          await loadLibrary();
        }
      } catch (e) {
        alert('删除失败');
      }
    };

    // Open Comic Reader
    const openComic = async (comic) => {
      loading.value = true;
      try {
        const res = await fetch(`/api/comic/details?comic_id=${comic.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || '无法加载画册详情');

        currentComic.value = data;
        
        // Restore progress if available
        const savedPage = localStorage.getItem(`comic_progress_${comic.id}`);
        const initPage = savedPage ? parseInt(savedPage, 10) : 0;
        currentPageIndex.value = Math.min(Math.max(0, initPage), Math.max(0, data.total_pages - 1));

        viewMode.value = 'reader';
        showHud.value = true;
        showThumbnailDrawer.value = false;
        loadedPages.value.clear();

        resetHudTimer();

        await nextTick();
        initTouch();
        preloadPages();

        if (readingMode.value === 'scroll') {
          scrollToCurrentWebtoonPage();
        }
      } catch (e) {
        alert('打开漫画失败: ' + e.message);
      } finally {
        loading.value = false;
      }
    };

    const closeReader = () => {
      if (touchController) {
        touchController.destroy();
        touchController = null;
      }
      viewMode.value = 'library';
      currentComic.value = null;
    };

    // Quick Navigation Toolbar (Back to last page, Parent folder, Bookshelf Root)
    const goHome = () => {
      if (viewMode.value === 'reader') {
        closeReader();
      }
      searchQuery.value = '';
      loadLibrary('');
    };

    const goBack = () => {
      if (viewMode.value === 'reader') {
        closeReader();
        return;
      }
      if (navHistory.value.length > 0) {
        const prev = navHistory.value.pop();
        loadLibrary(prev, true);
      } else if (!isRoot.value) {
        loadLibrary('');
      }
    };

    const goParent = () => {
      if (viewMode.value === 'reader') {
        closeReader();
        return;
      }
      if (!isRoot.value) {
        if (currentDirectory.value && currentDirectory.value.encoded_parent_path) {
          loadLibrary(currentDirectory.value.encoded_parent_path);
        } else if (breadcrumbs.value && breadcrumbs.value.length > 1) {
          const parentCrumb = breadcrumbs.value[breadcrumbs.value.length - 2];
          loadLibrary(parentCrumb.encoded_path);
        } else {
          loadLibrary('');
        }
      }
    };

    // Paged Reading Click Zones
    const onLeftZoneClick = () => {
      if (readingDirection.value === 'rtl') {
        nextPageInternal();
      } else {
        prevPageInternal();
      }
    };

    const onRightZoneClick = () => {
      if (readingDirection.value === 'rtl') {
        prevPageInternal();
      } else {
        nextPageInternal();
      }
    };

    // Comic Download
    const downloadingComics = ref(new Set());

    const downloadComic = (comic) => {
      if (downloadingComics.value.has(comic.id)) return;
      downloadingComics.value.add(comic.id);

      const downloadUrl = `/api/comic/download?comic_id=${comic.id}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${comic.name || comic.title || 'comic'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        downloadingComics.value.delete(comic.id);
      }, 3000);
    };

    // Reader Navigation & Preloading
    const goToPage = (index) => {
      if (!currentComic.value) return;
      if (index < 0 || index >= currentComic.value.total_pages) return;

      currentPageIndex.value = index;
      localStorage.setItem(`comic_progress_${currentComic.value.id}`, index);

      if (touchController) {
        touchController.resetZoom();
      }

      if (readingMode.value === 'scroll') {
        scrollToCurrentWebtoonPage();
      }

      preloadPages();
    };

    const prevPage = () => {
      if (readingDirection.value === 'rtl') {
        nextPageInternal();
      } else {
        prevPageInternal();
      }
    };

    const nextPage = () => {
      if (readingDirection.value === 'rtl') {
        prevPageInternal();
      } else {
        nextPageInternal();
      }
    };

    const prevPageInternal = () => {
      if (currentPageIndex.value > 0) {
        const step = isDoublePage.value ? 2 : 1;
        goToPage(Math.max(0, currentPageIndex.value - step));
      }
    };

    const nextPageInternal = () => {
      if (currentComic.value && currentPageIndex.value < currentComic.value.total_pages - 1) {
        const step = isDoublePage.value ? 2 : 1;
        goToPage(Math.min(currentComic.value.total_pages - 1, currentPageIndex.value + step));
      }
    };

    const preloadPages = () => {
      if (!currentComic.value || readingMode.value === 'scroll') return;
      const cur = currentPageIndex.value;
      const total = currentComic.value.total_pages;

      // In dual page mode, preload next 6 and prev 2 pages
      const targets = weakNetworkMode.value
        ? [cur, cur + 1, cur + 2, cur + 3, cur + 4, cur + 5, cur - 1, cur - 2].filter(idx => idx >= 0 && idx < total)
        : [cur, cur + 1, cur + 2, cur + 3, cur - 1].filter(idx => idx >= 0 && idx < total);

      targets.forEach(idx => {
        const pageUrl = getPageUrl(idx);
        if (!loadedPages.value.has(pageUrl)) {
          const img = new Image();
          img.src = pageUrl;
          img.onload = () => loadedPages.value.add(pageUrl);
        }
      });
    };

    const scrollToCurrentWebtoonPage = () => {
      nextTick(() => {
        const el = document.getElementById(`webtoon-page-${currentPageIndex.value}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    };

    const handleWebtoonScroll = (e) => {
      const container = e.target;
      const items = container.querySelectorAll('.webtoon-item');
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const offsetTop = item.offsetTop;
        const height = item.offsetHeight;
        if (offsetTop + height / 2 >= scrollTop) {
          if (currentPageIndex.value !== i) {
            currentPageIndex.value = i;
            if (currentComic.value) {
              localStorage.setItem(`comic_progress_${currentComic.value.id}`, i);
            }
          }
          break;
        }
      }
    };

    // HUD & Fullscreen Controls
    const toggleHud = () => {
      showHud.value = !showHud.value;
      if (showHud.value) {
        resetHudTimer();
      }
    };

    const resetHudTimer = () => {
      if (hudTimer) clearTimeout(hudTimer);
      hudTimer = setTimeout(() => {
        showHud.value = false;
        showThumbnailDrawer.value = false;
      }, 5000);
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          isFullscreen.value = true;
        }).catch(err => console.error(err));
      } else {
        document.exitFullscreen().then(() => {
          isFullscreen.value = false;
        });
      }
    };

    const toggleReadingMode = () => {
      readingMode.value = readingMode.value === 'paged' ? 'scroll' : 'paged';
      saveSettings();
      if (readingMode.value === 'scroll') {
        scrollToCurrentWebtoonPage();
      }
    };

    const toggleReadingDirection = () => {
      readingDirection.value = readingDirection.value === 'ltr' ? 'rtl' : 'ltr';
      saveSettings();
    };

    // Touch Integration
    const initTouch = () => {
      const viewportEl = document.querySelector('.reader-viewport');
      if (!viewportEl) return;

      if (touchController) {
        touchController.destroy();
      }

      touchController = new TouchController(viewportEl, {
        onSwipeLeft: () => {
          if (readingDirection.value === 'rtl') prevPageInternal();
          else nextPageInternal();
        },
        onSwipeRight: () => {
          if (readingDirection.value === 'rtl') nextPageInternal();
          else prevPageInternal();
        },
        onTap: ({ x, y }) => {
          const width = window.innerWidth;
          const height = window.innerHeight;

          // 1. Single tap on the TOP 22% area -> ALWAYS show top HUD with Exit button
          if (y < height * 0.22) {
            showHud.value = true;
            resetHudTimer();
            return;
          }

          // 2. Single tap on the BOTTOM 15% area -> ALWAYS show HUD with page slider
          if (y > height * 0.85) {
            showHud.value = true;
            resetHudTimer();
            return;
          }

          // 3. Dual Page vs Single Page Tap Zones
          if (isDoublePage.value) {
            // Dual Page: Left Half (0-46%) vs Right Half (54-100%) vs Middle Seam
            if (x < width * 0.46) {
              onLeftZoneClick();
            } else if (x > width * 0.54) {
              onRightZoneClick();
            } else {
              toggleHud();
            }
          } else {
            // Single Page: Left 20% vs Right 20% vs Center 60%
            if (x < width * 0.20) {
              onLeftZoneClick();
            } else if (x > width * 0.80) {
              onRightZoneClick();
            } else {
              toggleHud();
            }
          }
        },
        onDoubleTap: () => {},
        onZoomChange: (scale) => {
          currentZoom.value = scale;
        }
      });
    };

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (viewMode.value !== 'reader') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          prevPage();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleReadingMode();
          break;
        case 'd':
        case 'D':
          if (isWideOrLandscape.value && readingMode.value === 'paged') {
            togglePageSpread();
          }
          break;
        case 'Escape':
          if (showThumbnailDrawer.value) {
            showThumbnailDrawer.value = false;
          } else {
            closeReader();
          }
          break;
      }
    };

    onMounted(async () => {
      loadSettings();
      updateScreenOrientation();
      window.addEventListener('resize', updateScreenOrientation);
      window.addEventListener('orientationchange', updateScreenOrientation);

      await fetchSystemInfo();
      await fetchSystemDrives();
      await loadLibrary();

      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement;
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateScreenOrientation);
      window.removeEventListener('orientationchange', updateScreenOrientation);
      if (touchController) touchController.destroy();
      if (hudTimer) clearTimeout(hudTimer);
    });

    return {
      viewMode,
      currentPath,
      breadcrumbs,
      searchQuery,
      loading,
      errorMsg,
      isRoot,
      bookshelves,
      currentDirectory,
      systemDrives,
      filteredFolders,
      filteredComics,
      showBookshelfModal,
      showInfoModal,
      showSettingsModal,
      newShelfPath,
      newShelfName,
      addingShelf,
      systemInfo,
      currentComic,
      currentPageIndex,
      weakNetworkMode,
      toggleWeakNetworkMode,
      getPageUrl,
      readingMode,
      readingDirection,
      pageSpread,
      isWideOrLandscape,
      isDoublePage,
      currentPairIndex,
      togglePageSpread,
      showHud,
      showThumbnailDrawer,
      isFullscreen,
      currentZoom,
      navHistory,
      loadLibrary,
      navigateToCrumb,
      openFolder,
      handleAddBookshelf,
      handleDeleteBookshelf,
      openComic,
      closeReader,
      downloadComic,
      downloadingComics,
      goHome,
      goBack,
      goParent,
      onLeftZoneClick,
      onRightZoneClick,
      goToPage,
      prevPage,
      nextPage,
      toggleHud,
      toggleFullscreen,
      toggleReadingMode,
      toggleReadingDirection,
      handleWebtoonScroll
    };
  }
}).mount('#app');

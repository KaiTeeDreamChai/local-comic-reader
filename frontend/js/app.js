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
    const showHud = ref(true);
    const showThumbnailDrawer = ref(false);
    const isFullscreen = ref(false);
    const currentZoom = ref(1);
    const loadedPages = ref(new Set());

    let touchController = null;
    let hudTimer = null;

    // Load App Settings from LocalStorage or Server
    const loadSettings = () => {
      const savedMode = localStorage.getItem('comic_reading_mode');
      if (savedMode) readingMode.value = savedMode;
      const savedDir = localStorage.getItem('comic_reading_dir');
      if (savedDir) readingDirection.value = savedDir;
    };

    const saveSettings = () => {
      localStorage.setItem('comic_reading_mode', readingMode.value);
      localStorage.setItem('comic_reading_dir', readingDirection.value);
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

    // Load Library (Root or Subpath)
    const loadLibrary = async (encodedPath = '') => {
      loading.value = true;
      errorMsg.value = '';
      try {
        const url = encodedPath ? `/api/library/browse?encoded_path=${encodedPath}` : '/api/library/browse';
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || '加载目录失败');

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
        errorMsg.value = e.message;
      } finally {
        loading.value = false;
      }
    };

    const updateBreadcrumbs = (data) => {
      const sep = data.current_path.includes('\\') ? '\\' : '/';
      const parts = data.current_path.split(sep).filter(Boolean);
      
      const crumbs = [{ name: '首页', encoded_path: '' }];
      // Build step-by-step crumbs
      let accumulated = '';
      if (sep === '/' && data.current_path.startsWith('/')) {
        accumulated = '';
      }
      
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

      // Simple breadcrumbs fallback if too long: home + parent + current
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

        // Reset auto hide timer for HUD
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

    // Quick Bottom-Left Navigation
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
      if (!isRoot.value) {
        if (breadcrumbs.value && breadcrumbs.value.length > 1) {
          const prevCrumb = breadcrumbs.value[breadcrumbs.value.length - 2];
          loadLibrary(prevCrumb.encoded_path);
        } else {
          loadLibrary('');
        }
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
        goToPage(currentPageIndex.value - 1);
      }
    };

    const nextPageInternal = () => {
      if (currentComic.value && currentPageIndex.value < currentComic.value.total_pages - 1) {
        goToPage(currentPageIndex.value + 1);
      }
    };

    const preloadPages = () => {
      if (!currentComic.value || readingMode.value === 'scroll') return;
      const cur = currentPageIndex.value;
      const total = currentComic.value.total_pages;

      // Preload cur-1, cur+1, cur+2
      const targets = [cur, cur + 1, cur + 2, cur - 1].filter(idx => idx >= 0 && idx < total);
      targets.forEach(idx => {
        if (!loadedPages.value.has(idx)) {
          const img = new Image();
          img.src = currentComic.value.pages[idx].url;
          img.onload = () => loadedPages.value.add(idx);
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
        onTap: ({ x }) => {
          const width = window.innerWidth;
          const leftZone = width * 0.3;
          const rightZone = width * 0.7;

          if (x < leftZone) {
            prevPage();
          } else if (x > rightZone) {
            nextPage();
          } else {
            toggleHud();
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
      readingMode,
      readingDirection,
      showHud,
      showThumbnailDrawer,
      isFullscreen,
      currentZoom,
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

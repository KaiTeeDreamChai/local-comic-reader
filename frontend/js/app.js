// Main Vue 3 Application Controller
(function() {
const { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

createApp({
  setup() {
    // 1. Navigation & View State
    const viewMode = ref('library'); // 'library' | 'reader'
    const currentPath = ref('');
    const breadcrumbs = ref([]);
    const searchQuery = ref('');
    const loading = ref(false);
    const errorMsg = ref('');
    const navHistory = ref([]); // History stack for back navigation

    // 2. Library Data
    const isRoot = ref(true);
    const bookshelves = ref([]);
    const currentDirectory = ref({ name: '', current_path: '', folders: [], comics: [] });
    const systemDrives = ref([]);

    // 3. Modals State
    const showBookshelfModal = ref(false);
    const showInfoModal = ref(false);
    const showSettingsModal = ref(false);
    const newShelfPath = ref('');
    const newShelfName = ref('');
    const addingShelf = ref(false);

    // 4. System & Network State
    const systemInfo = ref({ lan_urls: [], local_ips: [], port: 8000, platform: '' });
    const downloadingComics = ref(new Set());
    const weakNetworkMode = ref(localStorage.getItem('comic_weak_net_mode') === 'true');

    // 5. Common Reader State
    const currentComic = ref(null);
    const currentPageIndex = ref(0);

    // 6. Internationalization (i18n)
    const currentLang = ref(localStorage.getItem('comic_lang') || 'zh');
    const t = (key, params = {}) => {
      const dict = window.i18nTranslations && window.i18nTranslations[currentLang.value]
        ? window.i18nTranslations[currentLang.value]
        : window.i18nTranslations['zh'];
      let text = (dict && dict[key]) || key;
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
      return text;
    };

    const setLanguage = (lang) => {
      currentLang.value = lang;
      localStorage.setItem('comic_lang', lang);
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    };

    // 7. Compose Submodules
    const novelReader = window.useNovelReader(currentComic, currentPageIndex);
    const comicReader = window.useComicReader(currentComic, currentPageIndex, weakNetworkMode, t);

    const saveSettings = () => {
      if (comicReader) {
        localStorage.setItem('comic_reading_mode', comicReader.readingMode.value);
        localStorage.setItem('comic_reading_direction', comicReader.readingDirection.value);
      }
    };

    let touchController = null;

    const toggleWeakNetworkMode = () => {
      weakNetworkMode.value = !weakNetworkMode.value;
      localStorage.setItem('comic_weak_net_mode', weakNetworkMode.value.toString());
      if (viewMode.value === 'reader' && currentComic.value && currentComic.value.type !== 'book') {
        comicReader.preloadPages();
      }
    };

    // Filtered lists for search in library
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

    // 8. Library Browsing & Actions
    const loadLibrary = async (encodedPath = '') => {
      loading.value = true;
      errorMsg.value = '';
      try {
        const data = await window.API.browseLibrary(encodedPath);
        if (data.is_root) {
          isRoot.value = true;
          bookshelves.value = data.bookshelves || [];
          breadcrumbs.value = [{ name: '首页', encoded_path: '' }];
          currentPath.value = '';
        } else {
          isRoot.value = false;
          currentDirectory.value = data;
          breadcrumbs.value = data.breadcrumbs || [];
          currentPath.value = data.current_path || '';
        }
      } catch (e) {
        errorMsg.value = e.message || '加载目录出错';
      } finally {
        loading.value = false;
      }
    };

    const pushNavHistory = (encodedPath) => {
      navHistory.value.push(encodedPath || '');
    };

    const navigateToCrumb = (crumb) => {
      pushNavHistory(currentPath.value ? btoa(unescape(encodeURIComponent(currentPath.value))) : '');
      loadLibrary(crumb.encoded_path);
    };

    const openFolder = (folder) => {
      pushNavHistory(currentPath.value ? btoa(unescape(encodeURIComponent(currentPath.value))) : '');
      loadLibrary(folder.encoded_path);
    };

    const handleAddBookshelf = async () => {
      if (!newShelfPath.value.trim()) return;
      addingShelf.value = true;
      try {
        await window.API.addBookshelf(newShelfPath.value.trim(), newShelfName.value.trim());
        newShelfPath.value = '';
        newShelfName.value = '';
        await loadLibrary();
      } catch (e) {
        alert(e.message);
      } finally {
        addingShelf.value = false;
      }
    };

    const handleDeleteBookshelf = async (shelfId) => {
      if (!confirm(t('confirmRemoveShelf'))) return;
      try {
        await window.API.removeBookshelf(shelfId);
        await loadLibrary();
      } catch (e) {
        alert(e.message || '删除失败');
      }
    };

    // 9. Open & Close Reader
    const openComic = async (comic) => {
      loading.value = true;
      try {
        const data = await window.API.getComicDetails(comic.id);
        currentComic.value = data;

        // Restore progress if available
        const savedPage = localStorage.getItem(`comic_progress_${comic.id}`);
        const initPage = savedPage ? parseInt(savedPage, 10) : 0;
        currentPageIndex.value = Math.min(Math.max(0, initPage), Math.max(0, (data.total_pages || 1) - 1));
        novelReader.novelChapterIndex.value = currentPageIndex.value;

        // Load bookmarks if this is an ebook/novel
        if (data.type === 'book') {
          novelReader.loadBookmarks(data.id);
        }

        viewMode.value = 'reader';
        comicReader.showHud.value = true;
        comicReader.showThumbnailDrawer.value = false;
        novelReader.showBookmarkDrawer.value = false;
        comicReader.loadedPages.value.clear();

        await nextTick();
        if (data.type === 'book') {
          const savedScroll = localStorage.getItem(`novel_scroll_${data.id}_ch${novelReader.novelChapterIndex.value}`);
          const scrollPos = savedScroll ? parseInt(savedScroll, 10) : 0;
          const viewport = document.querySelector('.novel-reader-viewport');
          if (viewport) {
            viewport.scrollTop = scrollPos;
          }
        } else {
          initTouch();
          comicReader.preloadPages();

          if (comicReader.readingMode.value === 'scroll') {
            comicReader.scrollToCurrentWebtoonPage();
          }
        }
      } catch (e) {
        alert('打开内容失败: ' + e.message);
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

    // 10. Navigation Bar Actions
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
        const last = navHistory.value.pop();
        loadLibrary(last);
      } else if (!isRoot.value) {
        goParent();
      }
    };

    const goParent = () => {
      if (isRoot.value) return;
      if (breadcrumbs.value.length >= 2) {
        const parentCrumb = breadcrumbs.value[breadcrumbs.value.length - 2];
        loadLibrary(parentCrumb.encoded_path);
      } else {
        loadLibrary('');
      }
    };

    // 11. Comic & Media Download
    const downloadComic = async (comic) => {
      if (!comic || !comic.id) return;
      downloadingComics.value.add(comic.id);
      try {
        const downloadUrl = window.API.getDownloadUrl(comic.id);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const ext = (comic.type === 'book' && comic.ext) ? comic.ext : '.zip';
        a.download = `${comic.name || comic.title || 'comic'}${ext.startsWith('.') ? ext : '.' + ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        alert('下载出错: ' + err.message);
      } finally {
        setTimeout(() => {
          downloadingComics.value.delete(comic.id);
        }, 2000);
      }
    };

    // 12. Touch Controller Integration
    const initTouch = () => {
      const viewportEl = document.querySelector('.reader-viewport');
      if (!viewportEl) return;

      if (touchController) {
        touchController.destroy();
      }

      touchController = new TouchController(viewportEl, {
        onSwipeLeft: () => {
          if (comicReader.readingDirection.value === 'rtl') comicReader.prevPageInternal();
          else comicReader.nextPageInternal();
        },
        onSwipeRight: () => {
          if (comicReader.readingDirection.value === 'rtl') comicReader.nextPageInternal();
          else comicReader.prevPageInternal();
        },
        onTap: ({ x, y }) => {
          const width = window.innerWidth;
          const height = window.innerHeight;

          if (y < height * 0.22) {
            comicReader.showHud.value = true;
            return;
          }

          if (y > height * 0.85) {
            comicReader.showHud.value = true;
            return;
          }

          if (comicReader.isDoublePage.value) {
            if (x < width * 0.46) {
              comicReader.onLeftZoneClick();
            } else if (x > width * 0.54) {
              comicReader.onRightZoneClick();
            } else {
              comicReader.toggleHud();
            }
          } else {
            if (x < width * 0.20) {
              comicReader.onLeftZoneClick();
            } else if (x > width * 0.80) {
              comicReader.onRightZoneClick();
            } else {
              comicReader.toggleHud();
            }
          }
        },
        onDoubleTap: () => {},
        onZoomChange: (scale) => {
          comicReader.currentZoom.value = scale;
        }
      });
    };

    // 13. Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (viewMode.value !== 'reader') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          if (currentComic.value?.type === 'book') {
            novelReader.goToNovelChapter(novelReader.novelChapterIndex.value + 1);
          } else {
            comicReader.nextPage();
          }
          break;
        case 'ArrowLeft':
        case 'PageUp':
          if (currentComic.value?.type === 'book') {
            novelReader.goToNovelChapter(novelReader.novelChapterIndex.value - 1);
          } else {
            comicReader.prevPage();
          }
          break;
        case 'f':
        case 'F':
          comicReader.toggleFullscreen();
          break;
        case 'd':
        case 'D':
          if (comicReader.isWideOrLandscape.value && comicReader.readingMode.value === 'paged') {
            comicReader.togglePageSpread();
          }
          break;
        case 'm':
        case 'M':
          if (currentComic.value?.type !== 'book') {
            comicReader.toggleReadingMode();
          }
          break;
        case 'Escape':
          if (comicReader.showThumbnailDrawer.value || novelReader.showBookmarkDrawer.value) {
            comicReader.showThumbnailDrawer.value = false;
            novelReader.showBookmarkDrawer.value = false;
          } else {
            closeReader();
          }
          break;
      }
    };

    // 14. Lifecycle Hooks
    onMounted(async () => {
      comicReader.updateScreenOrientation();
      window.addEventListener('resize', comicReader.updateScreenOrientation);
      window.addEventListener('orientationchange', comicReader.updateScreenOrientation);
      window.addEventListener('keydown', handleKeyDown);

      try {
        const info = await window.API.getSystemInfo();
        systemInfo.value = info;
      } catch (e) {
        console.error(e);
      }

      try {
        const drivesResponse = await window.API.getDrives();
        systemDrives.value = drivesResponse.drives || [];
      } catch (e) {
        console.error(e);
      }

      await loadLibrary();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', comicReader.updateScreenOrientation);
      window.removeEventListener('orientationchange', comicReader.updateScreenOrientation);
      window.removeEventListener('keydown', handleKeyDown);
      if (touchController) {
        touchController.destroy();
      }
    });

    return {
      // Navigation & Library
      viewMode,
      currentPath,
      breadcrumbs,
      searchQuery,
      filteredFolders,
      filteredComics,
      loading,
      errorMsg,
      isRoot,
      bookshelves,
      showBookshelfModal,
      showInfoModal,
      showSettingsModal,
      newShelfPath,
      newShelfName,
      addingShelf,
      systemDrives,
      systemInfo,
      navHistory,
      loadLibrary,
      navigateToCrumb,
      openFolder,
      handleAddBookshelf,
      handleDeleteBookshelf,
      openComic,
      closeReader,
      goHome,
      goBack,
      goParent,
      downloadComic,
      downloadingComics,
      weakNetworkMode,
      toggleWeakNetworkMode,

      // i18n
      currentLang,
      t,
      setLanguage,
      saveSettings,

      // Comic Reader (Spread from comicReader module)
      currentComic,
      currentPageIndex,
      readingMode: comicReader.readingMode,
      readingDirection: comicReader.readingDirection,
      pageSpread: comicReader.pageSpread,
      isWideOrLandscape: comicReader.isWideOrLandscape,
      isDoublePage: comicReader.isDoublePage,
      currentPairIndex: comicReader.currentPairIndex,
      showHud: comicReader.showHud,
      showThumbnailDrawer: comicReader.showThumbnailDrawer,
      isFullscreen: comicReader.isFullscreen,
      currentZoom: comicReader.currentZoom,
      getPageUrl: comicReader.getPageUrl,
      goToPage: comicReader.goToPage,
      prevPage: comicReader.prevPage,
      nextPage: comicReader.nextPage,
      onLeftZoneClick: comicReader.onLeftZoneClick,
      onRightZoneClick: comicReader.onRightZoneClick,
      toggleHud: comicReader.toggleHud,
      toggleFullscreen: comicReader.toggleFullscreen,
      toggleReadingMode: comicReader.toggleReadingMode,
      toggleReadingDirection: comicReader.toggleReadingDirection,
      togglePageSpread: comicReader.togglePageSpread,
      handleWebtoonScroll: comicReader.handleWebtoonScroll,

      // Novel Reader (Spread from novelReader module)
      novelFontSize: novelReader.novelFontSize,
      novelTheme: novelReader.novelTheme,
      novelChapterIndex: novelReader.novelChapterIndex,
      bookBookmarks: novelReader.bookBookmarks,
      showBookmarkDrawer: novelReader.showBookmarkDrawer,
      isCurrentChapterBookmarked: novelReader.isCurrentChapterBookmarked,
      changeNovelFontSize: novelReader.changeNovelFontSize,
      setNovelTheme: novelReader.setNovelTheme,
      goToNovelChapter: novelReader.goToNovelChapter,
      handleNovelScroll: novelReader.handleNovelScroll,
      toggleBookmark: novelReader.toggleBookmark,
      removeBookmark: novelReader.removeBookmark
    };
  }
}).mount('#app');
})();

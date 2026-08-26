// Main Vue 3 Application Controller
(function() {
const { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

createApp({
  setup() {
    // 1. Navigation & View State
    const viewMode = ref('library'); // 'library' | 'reader'
    const libraryViewMode = ref('bookshelves'); // 'bookshelves' | 'favorites' | 'read_later' | 'categories' | 'category_detail'
    const currentPath = ref('');
    const breadcrumbs = ref([]);
    const searchQuery = ref('');
    const isSearchMode = ref(false);
    const showMobileMenu = ref(false);
    const highlightedItemId = ref(null);
    const loading = ref(false);
    const errorMsg = ref('');
    const navHistory = ref([]); // History stack for back navigation

    // 2. Collections & Categories Data
    const favorites = ref([]);
    const readLater = ref([]);
    const categories = ref([]);
    const currentCategory = ref(null);
    const showCategorySelectModal = ref(false);
    const targetComicForCategory = ref(null);
    const newCategoryNameInput = ref('');
    const showCreateCategoryModal = ref(false);

    // Fast lookup sets for active status badges, bookmarks & buttons
    const favoriteIdSet = computed(() => new Set(favorites.value.map(x => x.id)));
    const readLaterIdSet = computed(() => new Set(readLater.value.map(x => x.id)));
    const categorizedIdSet = computed(() => {
      const set = new Set();
      (categories.value || []).forEach(cat => {
        (cat.items || []).forEach(item => {
          if (item && item.id) set.add(item.id);
        });
      });
      return set;
    });

    const isCurrentComicFavorite = computed(() => {
      return currentComic.value && favoriteIdSet.value.has(currentComic.value.id);
    });
    const isCurrentComicReadLater = computed(() => {
      return currentComic.value && readLaterIdSet.value.has(currentComic.value.id);
    });

    // 3. Library Data
    const isRoot = ref(true);
    const bookshelves = ref([]);
    const currentDirectory = ref({ name: '', current_path: '', folders: [], comics: [] });
    const systemDrives = ref([]);

    // 4. Modals State
    const showBookshelfModal = ref(false);
    const showInfoModal = ref(false);
    const showSettingsModal = ref(false);
    const newShelfPath = ref('');
    const newShelfName = ref('');
    const addingShelf = ref(false);

    // 5. Authentication & Remote Security State
    const authStatus = reactive({
      is_local: true,
      is_remote: false,
      auth_required: false,
      is_authenticated: true,
      has_password: false,
      remote_auth_enabled: true,
      lan_bypass_auth: true,
      custom_domain: '',
      client_ip: ''
    });
    const showLoginModal = ref(false);
    const loginPassword = ref('');
    const loginRemember = ref(true);
    const loginLoading = ref(false);
    const loginError = ref('');
    const showPasswordText = ref(false);

    const securitySettings = reactive({
      remote_auth_enabled: true,
      lan_bypass_auth: true,
      custom_domain: '',
      has_password: false,
      old_password: '',
      new_password: '',
      confirm_password: ''
    });
    const savingSecurity = ref(false);
    const securitySuccessMsg = ref('');
    const securityErrorMsg = ref('');

    // 6. System & Network State
    const systemInfo = ref({ lan_urls: [], local_ips: [], ipv6_urls: [], ipv6_ips: [], port: 7891, platform: '' });
    const downloadingComics = ref(new Set());
    const weakNetworkMode = ref(localStorage.getItem('comic_weak_net_mode') === 'true');

    // 6. Common Reader State
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

    const fuzzyMatch = (query, target) => {
      const q = query.toLowerCase();
      const t = target.toLowerCase();
      if (t.includes(q)) return true;
      
      const qWords = q.split(/\s+/).filter(Boolean);
      if (qWords.length > 0 && qWords.every(word => t.includes(word))) return true;
      
      const qClean = q.replace(/[^\p{L}\p{N}]+/gu, '');
      const tClean = t.replace(/[^\p{L}\p{N}]+/gu, '');
      if (qClean && tClean.includes(qClean)) return true;
      
      if (qClean.length >= 3) {
        let tIndex = 0;
        for (let i = 0; i < qClean.length; i++) {
          tIndex = tClean.indexOf(qClean[i], tIndex);
          if (tIndex === -1) return false;
          tIndex++;
        }
        return true;
      }
      return false;
    };

    // Filtered lists for search in library
    const filteredFolders = computed(() => {
      if (isSearchMode.value || !searchQuery.value.trim()) return currentDirectory.value.folders || [];
      return (currentDirectory.value.folders || []).filter(f => fuzzyMatch(searchQuery.value, f.name));
    });

    const filteredComics = computed(() => {
      if (isSearchMode.value || !searchQuery.value.trim()) return currentDirectory.value.comics || [];
      return (currentDirectory.value.comics || []).filter(c => fuzzyMatch(searchQuery.value, c.name));
    });

    const filteredFavorites = computed(() => {
      if (!searchQuery.value.trim()) return favorites.value;
      return favorites.value.filter(item => fuzzyMatch(searchQuery.value, item.title || item.name));
    });

    const filteredReadLater = computed(() => {
      if (!searchQuery.value.trim()) return readLater.value;
      return readLater.value.filter(item => fuzzyMatch(searchQuery.value, item.title || item.name));
    });

    const filteredCategories = computed(() => {
      if (!searchQuery.value.trim()) return categories.value;
      return categories.value.filter(cat => fuzzyMatch(searchQuery.value, cat.name));
    });

    const filteredCategoryItems = computed(() => {
      if (!currentCategory.value) return [];
      const items = currentCategory.value.items || [];
      if (!searchQuery.value.trim()) return items;
      return items.filter(item => fuzzyMatch(searchQuery.value, item.title || item.name));
    });

    // Collections & Categories Handlers
    const loadCollections = async () => {
      try {
        const data = await window.API.getCollections();
        favorites.value = data.favorites || [];
        readLater.value = data.read_later || [];
        categories.value = data.categories || [];
        if (currentCategory.value) {
          currentCategory.value = categories.value.find(c => c.id === currentCategory.value.id) || null;
        }
      } catch (e) {
        console.error('Failed to load collections:', e);
      }
    };

    const toggleFavorite = async (item) => {
      if (!item) return;
      try {
        const res = await window.API.toggleFavorite(item);
        favorites.value = res.favorites || [];
      } catch (e) {
        alert(e.message || '操作失败');
      }
    };

    const toggleReadLater = async (item) => {
      if (!item) return;
      try {
        const res = await window.API.toggleReadLater(item);
        readLater.value = res.read_later || [];
      } catch (e) {
        alert(e.message || '操作失败');
      }
    };

    const openFavoritesView = () => {
      viewMode.value = 'library';
      libraryViewMode.value = 'favorites';
      currentPath.value = 'favorites';
      breadcrumbs.value = [{ name: t('home'), encoded_path: '' }, { name: '🌟 ' + t('defaultFavoritesFolder'), is_collection: true }];
      searchQuery.value = '';
      showMobileMenu.value = false;
    };

    const openReadLaterView = () => {
      viewMode.value = 'library';
      libraryViewMode.value = 'read_later';
      currentPath.value = 'read_later';
      breadcrumbs.value = [{ name: t('home'), encoded_path: '' }, { name: '🕒 ' + t('readLaterTitle'), is_collection: true }];
      searchQuery.value = '';
      showMobileMenu.value = false;
    };

    const openCategoriesView = () => {
      viewMode.value = 'library';
      libraryViewMode.value = 'categories';
      currentPath.value = 'categories';
      currentCategory.value = null;
      breadcrumbs.value = [{ name: t('home'), encoded_path: '' }, { name: '📁 ' + t('categoriesTitle'), is_collection: true }];
      searchQuery.value = '';
      showMobileMenu.value = false;
    };

    const openCategoryDetail = (category) => {
      viewMode.value = 'library';
      libraryViewMode.value = 'category_detail';
      currentCategory.value = category;
      currentPath.value = `category_${category.id}`;
      breadcrumbs.value = [
        { name: t('home'), encoded_path: '' },
        { name: '📁 ' + t('categoriesTitle'), to_categories: true },
        { name: category.name, is_collection: true }
      ];
      searchQuery.value = '';
    };

    const handleCreateCategory = async (name) => {
      const cleanName = (name || newCategoryNameInput.value).trim();
      if (!cleanName) return;
      try {
        const newCat = await window.API.createCategory(cleanName);
        newCategoryNameInput.value = '';
        showCreateCategoryModal.value = false;
        await loadCollections();
        return newCat;
      } catch (e) {
        alert(e.message || '创建分类失败');
      }
    };

    const handleRenameCategory = async (cat) => {
      const newName = prompt(t('categoryNamePlaceholder'), cat.name);
      if (!newName || !newName.trim() || newName.trim() === cat.name) return;
      try {
        await window.API.renameCategory(cat.id, newName.trim());
        await loadCollections();
      } catch (e) {
        alert(e.message || '重命名失败');
      }
    };

    const handleDeleteCategory = async (cat) => {
      if (!confirm(t('confirmDeleteCategory', { name: cat.name }))) return;
      try {
        await window.API.deleteCategory(cat.id);
        if (currentCategory.value && currentCategory.value.id === cat.id) {
          openCategoriesView();
        }
        await loadCollections();
      } catch (e) {
        alert(e.message || '删除失败');
      }
    };

    const openCategorySelectModal = (comic) => {
      targetComicForCategory.value = comic;
      showCategorySelectModal.value = true;
    };

    const isComicInCategory = (categoryId, comicId) => {
      const cat = categories.value.find(c => c.id === categoryId);
      return cat ? cat.items.some(x => x.id === comicId) : false;
    };

    const toggleComicCategory = async (categoryId, comic) => {
      try {
        const res = await window.API.toggleCategoryItem(categoryId, comic);
        categories.value = res.categories || [];
        if (currentCategory.value && currentCategory.value.id === categoryId) {
          currentCategory.value = res.category;
        }
      } catch (e) {
        alert(e.message || '操作分类失败');
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

    // 8. Library Browsing & Actions
    

    const performGlobalSearch = async () => {
      if (!searchQuery.value.trim()) {
        if (isSearchMode.value) {
          isSearchMode.value = false;
          loadLibrary('');
        }
        return;
      }
      showMobileMenu.value = false;
      loading.value = true;
      errorMsg.value = '';
      try {
        const data = await window.API.searchLibrary(searchQuery.value.trim());
        isRoot.value = false;
        isSearchMode.value = true;
        currentDirectory.value = data;
        breadcrumbs.value = [{ name: '首页', encoded_path: '' }, { name: '搜索: ' + searchQuery.value, encoded_path: '' }];
      } catch (e) {
        errorMsg.value = e.message || '搜索出错';
      } finally {
        loading.value = false;
      }
    };

    const scrollToAndHighlightItem = (targetId) => {
      if (!targetId) return;
      highlightedItemId.value = targetId;
      const tryScroll = (attempts = 6) => {
        nextTick(() => {
          const el = document.getElementById(`item-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (attempts > 0) {
            setTimeout(() => tryScroll(attempts - 1), 80);
          }
        });
      };
      tryScroll();
      setTimeout(() => {
        if (highlightedItemId.value === targetId) {
          highlightedItemId.value = null;
        }
      }, 3500);
    };

    const loadLibrary = async (encodedPath = '') => {
      loading.value = true;
      errorMsg.value = '';
      isSearchMode.value = false;
      libraryViewMode.value = 'bookshelves';
      currentCategory.value = null;
      try {
        const data = await window.API.browseLibrary(encodedPath);
        if (data.is_root) {
          isRoot.value = true;
          bookshelves.value = data.bookshelves || [];
          breadcrumbs.value = [{ name: t('home'), encoded_path: '' }];
          currentPath.value = '';
        } else {
          isRoot.value = false;
          currentDirectory.value = data;
          updateBreadcrumbs(data);
          currentPath.value = data.current_path || '';
        }

        if (highlightedItemId.value) {
          scrollToAndHighlightItem(highlightedItemId.value);
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
      if (crumb.to_categories) {
        openCategoriesView();
        return;
      }
      if (crumb.is_collection) {
        return;
      }
      const crumbIdx = breadcrumbs.value.findIndex(c => c.encoded_path === crumb.encoded_path);
      if (crumbIdx >= 0 && crumbIdx < breadcrumbs.value.length - 1) {
        const nextCrumb = breadcrumbs.value[crumbIdx + 1];
        if (nextCrumb && nextCrumb.encoded_path) {
          highlightedItemId.value = nextCrumb.encoded_path;
        }
      }

      pushNavHistory(currentPath.value ? btoa(unescape(encodeURIComponent(currentPath.value))) : '');
      searchQuery.value = '';
      isSearchMode.value = false;
      libraryViewMode.value = 'bookshelves';
      loadLibrary(crumb.encoded_path);
    };

    const openFolder = (folder) => {
      pushNavHistory(currentPath.value ? btoa(unescape(encodeURIComponent(currentPath.value))) : '');
      searchQuery.value = '';
      isSearchMode.value = false;
      libraryViewMode.value = 'bookshelves';
      highlightedItemId.value = folder.id;
      loadLibrary(folder.id);
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
      comicReader.cleanupWebtoonObserver();
      comicReader.loadedPages.value.clear();

      const lastComicId = currentComic.value?.id;
      // Stop video playback and clear resources
      try {
        const videoEl = document.getElementById('main-video-player');
        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
        }
        window.stop();
      } catch (e) {}

      viewMode.value = 'library';
      currentComic.value = null;

      if (lastComicId) {
        scrollToAndHighlightItem(lastComicId);
      }
    };

    const seekVideo = (seconds) => {
      const videoEl = document.getElementById('main-video-player') || document.querySelector('video');
      if (videoEl) {
        videoEl.currentTime = Math.max(0, Math.min(videoEl.duration || 0, videoEl.currentTime + seconds));
      }
    };

    // 10. Navigation Bar Actions
    const goHome = () => {
      if (viewMode.value === 'reader') {
        closeReader();
      }
      libraryViewMode.value = 'bookshelves';
      currentCategory.value = null;
      searchQuery.value = '';
      loadLibrary('');
    };

    const goBack = () => {
      if (viewMode.value === 'reader') {
        closeReader();
        return;
      }
      if (libraryViewMode.value === 'category_detail') {
        const catId = currentCategory.value?.id;
        openCategoriesView();
        if (catId) {
          scrollToAndHighlightItem(catId);
        }
        return;
      }
      if (libraryViewMode.value === 'favorites' || libraryViewMode.value === 'read_later' || libraryViewMode.value === 'categories') {
        goHome();
        return;
      }
      if (navHistory.value.length > 0) {
        const last = navHistory.value.pop();
        const childFolderId = currentDirectory.value ? (currentDirectory.value.encoded_path || '') : '';
        if (childFolderId) {
          highlightedItemId.value = childFolderId;
        }
        loadLibrary(last);
      } else if (!isRoot.value) {
        goParent();
      }
    };

    const goParent = () => {
      if (isRoot.value) return;
      const childFolderId = currentDirectory.value ? (currentDirectory.value.encoded_path || '') : '';
      if (childFolderId) {
        highlightedItemId.value = childFolderId;
      }
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

    // 14. Authentication & Security Handlers
    const checkAuthStatus = async () => {
      try {
        const auth = await window.API.getAuthStatus();
        if (auth && typeof auth === 'object') {
          Object.assign(authStatus, auth);
          securitySettings.remote_auth_enabled = !!auth.remote_auth_enabled;
          securitySettings.lan_bypass_auth = !!auth.lan_bypass_auth;
          securitySettings.custom_domain = auth.custom_domain || '';
          securitySettings.has_password = !!auth.has_password;

          if (auth.auth_required && !auth.is_authenticated) {
            showLoginModal.value = true;
            return false;
          }
        }
        return true;
      } catch (e) {
        console.warn('Failed to get auth status:', e);
        return true;
      }
    };

    const handleLogin = async () => {
      if (!loginPassword.value.trim()) {
        loginError.value = t('remoteAuthInputPlaceholder');
        return;
      }
      loginLoading.value = true;
      loginError.value = '';
      try {
        await window.API.login(loginPassword.value.trim(), loginRemember.value);
        showLoginModal.value = false;
        authStatus.is_authenticated = true;
        authStatus.auth_required = false;
        loginPassword.value = '';
        await loadCollections();
        await loadLibrary();
      } catch (e) {
        loginError.value = e.message || '密码验证失败';
      } finally {
        loginLoading.value = false;
      }
    };

    const handleLogout = async () => {
      try {
        await window.API.logout();
        authStatus.is_authenticated = false;
        const auth = await window.API.getAuthStatus();
        if (auth && typeof auth === 'object') {
          Object.assign(authStatus, auth);
          if (auth.auth_required) {
            showLoginModal.value = true;
          } else {
            alert('已退出远程授权状态');
          }
        }
      } catch (e) {
        console.warn('Logout error:', e);
      }
    };

    const handleSaveSecuritySettings = async () => {
      if (securitySettings.new_password) {
        if (securitySettings.new_password !== securitySettings.confirm_password) {
          securityErrorMsg.value = '两次输入的新密码不一致';
          return;
        }
      }
      savingSecurity.value = true;
      securityErrorMsg.value = '';
      securitySuccessMsg.value = '';
      try {
        const payload = {
          remote_auth_enabled: securitySettings.remote_auth_enabled,
          lan_bypass_auth: securitySettings.lan_bypass_auth,
          custom_domain: securitySettings.custom_domain
        };
        if (securitySettings.new_password) {
          payload.new_password = securitySettings.new_password;
          payload.old_password = securitySettings.old_password;
        }
        const res = await window.API.updateAuthConfig(payload);
        if (res && res.settings) {
          securitySettings.has_password = !!res.settings.has_password;
          securitySettings.custom_domain = res.settings.custom_domain || '';
          authStatus.has_password = !!res.settings.has_password;
          authStatus.remote_auth_enabled = !!res.settings.remote_auth_enabled;
          authStatus.lan_bypass_auth = !!res.settings.lan_bypass_auth;
          authStatus.custom_domain = res.settings.custom_domain || '';
        }
        securitySettings.old_password = '';
        securitySettings.new_password = '';
        securitySettings.confirm_password = '';
        securitySuccessMsg.value = (res && res.message) || '安全与域名设置保存成功';

        // Refresh systemInfo to update displayed URLs
        try {
          const info = await window.API.getSystemInfo();
          systemInfo.value = info;
        } catch (e) {
          console.warn(e);
        }

        setTimeout(() => { securitySuccessMsg.value = ''; }, 3500);
      } catch (e) {
        securityErrorMsg.value = e.message || '保存设置失败';
      } finally {
        savingSecurity.value = false;
      }
    };

    const copyToClipboard = async (text) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        alert(t('copySuccess') + ':\n' + text);
      } catch (e) {
        prompt('请复制访问地址：', text);
      }
    };

    // 15. Lifecycle Hooks
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

      const canProceed = await checkAuthStatus();
      if (canProceed) {
        await loadCollections();
        await loadLibrary();
      }
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
      libraryViewMode,
      currentPath,
      breadcrumbs,
      searchQuery,
      isSearchMode,
      showMobileMenu,
      highlightedItemId,
      performGlobalSearch,
      filteredFolders,
      filteredComics,
      filteredFavorites,
      filteredReadLater,
      filteredCategories,
      filteredCategoryItems,
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
      seekVideo,
      goHome,
      goBack,
      goParent,
      downloadComic,
      downloadingComics,
      weakNetworkMode,
      toggleWeakNetworkMode,

      // Authentication & Remote Security
      authStatus,
      showLoginModal,
      loginPassword,
      loginRemember,
      loginLoading,
      loginError,
      showPasswordText,
      securitySettings,
      savingSecurity,
      securitySuccessMsg,
      securityErrorMsg,
      checkAuthStatus,
      handleLogin,
      handleLogout,
      handleSaveSecuritySettings,
      copyToClipboard,

      // Collections & Categories
      favorites,
      readLater,
      categories,
      currentCategory,
      favoriteIdSet,
      readLaterIdSet,
      categorizedIdSet,
      isCurrentComicFavorite,
      isCurrentComicReadLater,
      showCategorySelectModal,
      targetComicForCategory,
      newCategoryNameInput,
      showCreateCategoryModal,
      toggleFavorite,
      toggleReadLater,
      openFavoritesView,
      openReadLaterView,
      openCategoriesView,
      openCategoryDetail,
      handleCreateCategory,
      handleRenameCategory,
      handleDeleteCategory,
      openCategorySelectModal,
      isComicInCategory,
      toggleComicCategory,

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
      onWebtoonImageLoad: comicReader.onWebtoonImageLoad,

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

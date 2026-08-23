// Comic reader controls, dual-page mode, preloading, and navigation
(function() {
const { ref, computed, nextTick } = Vue;

function useComicReader(currentComic, currentPageIndex, weakNetworkMode, t) {
  const readingMode = ref(localStorage.getItem('comic_reading_mode') || 'paged'); // 'paged' | 'scroll'
  const readingDirection = ref(localStorage.getItem('comic_reading_direction') || 'ltr'); // 'ltr' | 'rtl'
  const pageSpread = ref(localStorage.getItem('comic_page_spread') || 'single'); // 'single' | 'double'
  const isWideOrLandscape = ref(false);
  const showHud = ref(true);
  const showThumbnailDrawer = ref(false);
  const isFullscreen = ref(false);
  const currentZoom = ref(1);
  const loadedPages = ref(new Set());

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
    const next = currentPageIndex.value + 1;
    return next < currentComic.value.total_pages ? next : null;
  });

  const togglePageSpread = () => {
    pageSpread.value = pageSpread.value === 'single' ? 'double' : 'single';
    localStorage.setItem('comic_page_spread', pageSpread.value);
  };

  const getPageUrl = (pageIndex) => {
    if (!currentComic.value || !currentComic.value.pages || !currentComic.value.pages[pageIndex]) return '';
    return currentComic.value.pages[pageIndex].url;
  };

  const goToPage = (index) => {
    if (!currentComic.value) return;
    const total = currentComic.value.total_pages;
    if (index < 0 || index >= total) return;
    currentPageIndex.value = index;

    if (currentComic.value.id) {
      localStorage.setItem(`comic_progress_${currentComic.value.id}`, index);
    }

    if (readingMode.value === 'scroll') {
      scrollToCurrentWebtoonPage();
    } else {
      preloadPages();
    }
  };

  const prevPage = () => {
    if (readingDirection.value === 'rtl') nextPageInternal();
    else prevPageInternal();
  };

  const nextPage = () => {
    if (readingDirection.value === 'rtl') prevPageInternal();
    else nextPageInternal();
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

  const toggleHud = () => {
    showHud.value = !showHud.value;
    if (!showHud.value) {
      showThumbnailDrawer.value = false;
    }
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

  const toggleReadingMode = (saveSettingsCallback) => {
    readingMode.value = readingMode.value === 'paged' ? 'scroll' : 'paged';
    if (saveSettingsCallback) saveSettingsCallback();
    if (readingMode.value === 'scroll') {
      scrollToCurrentWebtoonPage();
    }
  };

  const toggleReadingDirection = (saveSettingsCallback) => {
    readingDirection.value = readingDirection.value === 'ltr' ? 'rtl' : 'ltr';
    if (saveSettingsCallback) saveSettingsCallback();
  };

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

  return {
    readingMode,
    readingDirection,
    pageSpread,
    isWideOrLandscape,
    showHud,
    showThumbnailDrawer,
    isFullscreen,
    currentZoom,
    loadedPages,
    isDoublePage,
    currentPairIndex,
    updateScreenOrientation,
    togglePageSpread,
    getPageUrl,
    goToPage,
    prevPage,
    nextPage,
    prevPageInternal,
    nextPageInternal,
    preloadPages,
    scrollToCurrentWebtoonPage,
    handleWebtoonScroll,
    toggleHud,
    toggleFullscreen,
    toggleReadingMode,
    toggleReadingDirection,
    onLeftZoneClick,
    onRightZoneClick
  };
};

window.useComicReader = useComicReader;
})();

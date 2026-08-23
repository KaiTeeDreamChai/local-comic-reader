// Novel reading state, themes, font sizing, and bookmark management
const { ref, computed, nextTick } = Vue;

function useNovelReader(currentComic, currentPageIndex) {
  const novelFontSize = ref(parseInt(localStorage.getItem('novel_font_size') || '18', 10));
  const novelTheme = ref(localStorage.getItem('novel_theme') || 'night'); // 'day' | 'sepia' | 'green' | 'night'
  const novelChapterIndex = ref(0);
  const bookBookmarks = ref([]);
  const showBookmarkDrawer = ref(false);

  const changeNovelFontSize = (delta) => {
    const newSize = Math.min(36, Math.max(12, novelFontSize.value + delta));
    novelFontSize.value = newSize;
    localStorage.setItem('novel_font_size', newSize.toString());
  };

  const setNovelTheme = (theme) => {
    novelTheme.value = theme;
    localStorage.setItem('novel_theme', theme);
  };

  const loadBookmarks = (comicId) => {
    try {
      const raw = localStorage.getItem(`novel_bookmarks_${comicId}`);
      bookBookmarks.value = raw ? JSON.parse(raw) : [];
    } catch (e) {
      bookBookmarks.value = [];
    }
  };

  const saveBookmarks = (comicId) => {
    try {
      localStorage.setItem(`novel_bookmarks_${comicId}`, JSON.stringify(bookBookmarks.value));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  };

  const isCurrentChapterBookmarked = computed(() => {
    if (!currentComic.value) return false;
    return bookBookmarks.value.some(b => b.chapterIndex === novelChapterIndex.value);
  });

  const toggleBookmark = () => {
    if (!currentComic.value || !currentComic.value.chapters) return;
    const chIdx = novelChapterIndex.value;
    const chapter = currentComic.value.chapters[chIdx];
    const existingIdx = bookBookmarks.value.findIndex(b => b.chapterIndex === chIdx);

    if (existingIdx >= 0) {
      bookBookmarks.value.splice(existingIdx, 1);
    } else {
      const firstPara = (chapter.paragraphs && chapter.paragraphs[0]) ? chapter.paragraphs[0].slice(0, 80) : '';
      bookBookmarks.value.push({
        id: Date.now().toString(),
        chapterIndex: chIdx,
        chapterTitle: chapter.title || `第 ${chIdx + 1} 章`,
        snippet: firstPara ? `${firstPara}...` : '',
        timestamp: new Date().toLocaleString()
      });
    }
    saveBookmarks(currentComic.value.id);
  };

  const removeBookmark = (bookmarkId) => {
    bookBookmarks.value = bookBookmarks.value.filter(b => b.id !== bookmarkId);
    if (currentComic.value) {
      saveBookmarks(currentComic.value.id);
    }
  };

  const goToNovelChapter = (idx, targetScrollTop = 0) => {
    if (!currentComic.value || !currentComic.value.chapters) return;
    if (idx < 0 || idx >= currentComic.value.chapters.length) return;
    novelChapterIndex.value = idx;
    currentPageIndex.value = idx;
    if (currentComic.value.id) {
      localStorage.setItem(`comic_progress_${currentComic.value.id}`, idx);
      localStorage.setItem(`novel_scroll_${currentComic.value.id}_ch${idx}`, targetScrollTop ? targetScrollTop.toString() : '0');
    }
    nextTick(() => {
      const viewport = document.querySelector('.novel-reader-viewport');
      if (viewport) {
        viewport.scrollTop = targetScrollTop || 0;
      }
    });
  };

  const handleNovelScroll = (e) => {
    if (!currentComic.value || currentComic.value.type !== 'book') return;
    const scrollTop = e.target.scrollTop;
    const comicId = currentComic.value.id;
    const chIdx = novelChapterIndex.value;
    localStorage.setItem(`novel_scroll_${comicId}_ch${chIdx}`, scrollTop.toString());
    localStorage.setItem(`comic_progress_${comicId}`, chIdx.toString());
  };

  return {
    novelFontSize,
    novelTheme,
    novelChapterIndex,
    bookBookmarks,
    showBookmarkDrawer,
    changeNovelFontSize,
    setNovelTheme,
    loadBookmarks,
    saveBookmarks,
    isCurrentChapterBookmarked,
    toggleBookmark,
    removeBookmark,
    goToNovelChapter,
    handleNovelScroll
  };
}

window.useNovelReader = useNovelReader;

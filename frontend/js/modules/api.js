// API client methods for local comic and ebook reader
const API = {
  async getSystemInfo() {
    const res = await fetch('/api/info');
    if (!res.ok) throw new Error('Failed to fetch system info');
    return await res.json();
  },

  async getConfig() {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to fetch config');
    return await res.json();
  },

  async updateSettings(settings) {
    const res = await fetch('/api/config/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return await res.json();
  },

  async addBookshelf(path, name = '') {
    const res = await fetch('/api/config/bookshelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to add bookshelf');
    return data;
  },

  async removeBookshelf(shelfId) {
    const res = await fetch(`/api/config/bookshelves/${shelfId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove bookshelf');
    return await res.json();
  },

  async getDrives() {
    const res = await fetch('/api/filesystem/drives');
    if (!res.ok) throw new Error('Failed to fetch drives');
    return await res.json();
  },

  async browseLibrary(encodedPath = '') {
    const url = encodedPath
      ? `/api/library/browse?encoded_path=${encodedPath}`
      : '/api/library/browse';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to browse directory');
    return data;
  },

  async searchLibrary(query) {
    const res = await fetch(`/api/library/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to search library');
    return data;
  },

  async getComicDetails(comicId) {
    const res = await fetch(`/api/comic/details?comic_id=${comicId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to load details');
    return data;
  },

  getPageUrl(comicId, pageIndex, optimize = false) {
    return `/api/comic/page?comic_id=${comicId}&page_index=${pageIndex}${optimize ? '&optimize=true' : ''}`;
  },

  getThumbnailUrl(comicId, pageIndex = 0, size = 360) {
    return `/api/comic/thumbnail?comic_id=${comicId}&page_index=${pageIndex}&size=${size}`;
  },

  getDownloadUrl(comicId) {
    return `/api/comic/download?comic_id=${comicId}`;
  },

  // Collections & Categories
  async getCollections() {
    const res = await fetch('/api/collections/all');
    if (!res.ok) throw new Error('Failed to fetch collections');
    return await res.json();
  },

  async toggleFavorite(item) {
    const res = await fetch('/api/collections/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to toggle favorite');
    return data;
  },

  async toggleReadLater(item) {
    const res = await fetch('/api/collections/read_later', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to toggle read later');
    return data;
  },

  async createCategory(name) {
    const res = await fetch('/api/collections/category/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to create category');
    return data;
  },

  async renameCategory(categoryId, name) {
    const res = await fetch('/api/collections/category/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to rename category');
    return data;
  },

  async deleteCategory(categoryId) {
    const res = await fetch('/api/collections/category/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to delete category');
    return data;
  },

  async toggleCategoryItem(categoryId, item) {
    const res = await fetch('/api/collections/category/toggle_item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, item })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update category item');
    return data;
  },

  // Authentication & Security
  async getAuthStatus() {
    const res = await fetch('/api/auth/status');
    if (!res.ok) throw new Error('Failed to fetch auth status');
    return await res.json();
  },

  async login(password, remember = true) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, remember })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || '密码验证失败');
    return data;
  },

  async logout() {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  async updateAuthConfig(config) {
    const res = await fetch('/api/auth/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || '更新安全设置失败');
    return data;
  }
};

window.API = API;

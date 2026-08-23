/**
 * Internationalization (i18n) Dictionary
 * Supports Simplified Chinese (zh) and English (en)
 */
const i18n = {
  zh: {
    // Header
    appName: '本地画册 & 漫画阅读器',
    bookshelfManage: '书架管理',
    lanDevice: '局域网设备连接',
    turboModeOn: '弱网加速模式：已开启',
    turboModeOff: '弱网加速模式：已关闭',
    turboModeActive: '弱网加速',
    settings: '设置',

    // Breadcrumbs & Search
    home: '首页',
    searchPlaceholder: '搜索画册、漫画、视频或文件夹名称...',

    // Bookshelves / Library
    bookshelfCount: '已添加的书架目录',
    noBookshelves: '暂无书架目录',
    noBookshelvesDesc: '请点击上方“书架管理”添加您电脑上的漫画文件夹（例如 D:\\Comics 或 ~/Pictures）',
    addBookshelfNow: '立即添加书架目录',
    bookshelfBadge: '书架',
    folderBadge: '目录',
    subFolders: '子目录',
    comicsSection: '漫画、画册与视频',
    noCover: '无封面',
    videoBadge: '视频',
    folderTypeBadge: '文件夹',
    downloadZipTitle: '下载ZIP压缩包',
    emptyDir: '此文件夹下未找到漫画、画册、ZIP、PDF或视频文件',

    // Error
    errorTitle: '该目录不可用或无法访问',
    errorDescFallback: '此目录可能已被移动、删除，或超出了已配置书架的安全范围。',
    backToLast: '返回上一个页面',
    backToHome: '回到书架首页',

    // Navigation Toolbar
    btnBack: '返回',
    btnBackTitle: '返回上一个所访问的页面',
    btnParent: '上一级',
    btnParentTitle: '进入上一层目录',
    btnHome: '主页',
    btnHomeTitle: '回到书架首页',

    // Reader Top Bar
    exit: '退出',
    pageIndicator: '第 {current} / {total} 页',
    pagePairIndicator: '第 {start}-{end} / {total} 页',
    modePaged: '分页',
    modeScroll: '条漫',
    modePagedDesc: '切换为条漫瀑布流',
    modeScrollDesc: '切换为分页模式',
    spreadSingle: '单页',
    spreadDouble: '双页',
    spreadSingleDesc: '当前单页显示，点击切换双页并排',
    spreadDoubleDesc: '当前双页并排显示，点击切换单页',
    dirRTLDesc: '切换为左至右(LTR)',
    dirLTRDesc: '切换为右至左日漫(RTL)',
    fullscreen: '全屏切换',
    downloadCurrent: '下载当前漫画 ({title}.zip)',
    mangaRTL: '日漫(RTL)',
    mangaLTR: '单页(LTR)',
    mangaDoubleRTL: '双页日漫(RTL)',
    mangaDoubleLTR: '双页(LTR)',
    waterfallMode: '条漫',
    videoMode: '视频播放',

    // Reader Bottom Bar & Drawer
    prevPageTitle: '上一页 / 翻页',
    nextPageTitle: '下一页 / 翻页',
    allThumbnails: '查看所有缩略图',
    topExitHint: '点击顶部呼出菜单与退出按钮',
    leftClickTurn: '点击翻页 (左侧区域)',
    rightClickTurn: '点击翻页 (右侧区域)',
    centerClickHud: '点击呼出/收起控制栏',

    // Video Player
    videoUnsupported: '您的浏览器暂不支持播放此视频格式，请尝试下载后播放。',

    // Bookshelf Modal
    modalBookshelfTitle: '书架目录管理',
    inputPathLabel: '添加本地电脑文件夹路径',
    inputPathPlaceholder: '例如: D:\\Comics 或 /Users/name/Pictures',
    inputNamePlaceholder: '书架名称 (可选，默认使用文件夹名)',
    btnAdd: '添加',
    btnAdding: '添加中...',
    quickDrivesLabel: '快捷填入系统根目录/盘符：',
    addedShelvesLabel: '已添加的书架 ({count})',
    noAddedShelves: '暂无已添加书架',
    btnDone: '完成',
    confirmRemoveShelf: '确定要从书架中移除此文件夹吗？（不会删除电脑上的实际文件）',

    // LAN Info Modal
    modalLanTitle: '局域网多设备访问',
    lanDesc: '请确保平板、手机与电脑连接在同一个 Wi-Fi / 局域网下，在手机或平板浏览器中输入以下地址即可浏览：',
    openLink: '打开',
    touchTipsTitle: '触屏手势操作提示：',
    touchTip1: '左右滑动或点击两侧 20% 区域即可快速翻页',
    touchTip2: '双页模式下直接点击左右两页即可翻页',
    touchTip3: '双击或两指张开可放大细节 (Pinch-to-zoom)',
    touchTip4: '支持国漫 (LTR) / 日漫 (RTL) / 条漫瀑布流无缝切换',
    touchTip5: '弱网模式可大幅加速图片加载并优化视频播放',
    btnGotIt: '知道了',

    // Settings Modal
    modalSettingsTitle: '设置与偏好',
    languageSetting: '语言 / Language',
    langZh: '简体中文 (Chinese)',
    langEn: 'English',
    readingPrefs: '阅读偏好',
    defaultReadingMode: '默认阅读模式',
    defaultDirection: '默认分页翻页方向',
    dirLTR: '从左往右 (LTR / 国漫/画集)',
    dirRTL: '从右往左 (RTL / 日漫)',
    weakNetworkDesc: '弱网加速模式：自适应优化画质、预加载并平滑视频分段',
    aboutApp: '关于本项目',
    aboutDesc: '轻量级本地漫画/画册/视频局域网浏览工具，基于 FastAPI + Vue3 开发。'
  },

  en: {
    // Header
    appName: 'Local Comic & Media Reader',
    bookshelfManage: 'Bookshelves',
    lanDevice: 'LAN Connection',
    turboModeOn: 'Turbo Mode: Enabled',
    turboModeOff: 'Turbo Mode: Disabled',
    turboModeActive: 'Turbo',
    settings: 'Settings',

    // Breadcrumbs & Search
    home: 'Home',
    searchPlaceholder: 'Search albums, comics, videos or folders...',

    // Bookshelves / Library
    bookshelfCount: 'Configured Bookshelves',
    noBookshelves: 'No Bookshelves Configured',
    noBookshelvesDesc: 'Click "Bookshelves" above to add folders from your PC (e.g. D:\\Comics or ~/Pictures)',
    addBookshelfNow: 'Add Bookshelf Directory',
    bookshelfBadge: 'Bookshelf',
    folderBadge: 'Folder',
    subFolders: 'Sub-folders',
    comicsSection: 'Comics, Albums & Videos',
    noCover: 'No Cover',
    videoBadge: 'VIDEO',
    folderTypeBadge: 'Folder',
    downloadZipTitle: 'Download as ZIP archive',
    emptyDir: 'No comics, albums, archives, PDFs or videos found in this folder',

    // Error
    errorTitle: 'Directory Unavailable or Inaccessible',
    errorDescFallback: 'This directory might have been moved, deleted, or is outside configured bookshelf boundaries.',
    backToLast: 'Back to Previous Page',
    backToHome: 'Back to Bookshelf Home',

    // Navigation Toolbar
    btnBack: 'Back',
    btnBackTitle: 'Back to previous visited page',
    btnParent: 'Parent',
    btnParentTitle: 'Go to parent directory',
    btnHome: 'Home',
    btnHomeTitle: 'Back to bookshelf root',

    // Reader Top Bar
    exit: 'Exit',
    pageIndicator: 'Page {current} / {total}',
    pagePairIndicator: 'Pages {start}-{end} / {total}',
    modePaged: 'Paged',
    modeScroll: 'Waterfall',
    modePagedDesc: 'Switch to continuous waterfall scroll',
    modeScrollDesc: 'Switch to paged mode',
    spreadSingle: 'Single',
    spreadDouble: 'Double',
    spreadSingleDesc: 'Currently single page. Click to switch to dual-page spread',
    spreadDoubleDesc: 'Currently dual-page spread. Click to switch to single page',
    dirRTLDesc: 'Switch to Left-to-Right (LTR)',
    dirLTRDesc: 'Switch to Right-to-Left Manga (RTL)',
    fullscreen: 'Toggle Fullscreen',
    downloadCurrent: 'Download comic ({title}.zip)',
    mangaRTL: 'Manga(RTL)',
    mangaLTR: 'Single(LTR)',
    mangaDoubleRTL: 'Dual Manga(RTL)',
    mangaDoubleLTR: 'Dual(LTR)',
    waterfallMode: 'Waterfall',
    videoMode: 'Video Playback',

    // Reader Bottom Bar & Drawer
    prevPageTitle: 'Previous Page / Turn',
    nextPageTitle: 'Next Page / Turn',
    allThumbnails: 'Show All Thumbnails',
    topExitHint: 'Tap top area to show HUD and exit button',
    leftClickTurn: 'Click to turn page (Left side)',
    rightClickTurn: 'Click to turn page (Right side)',
    centerClickHud: 'Click to toggle control bars',

    // Video Player
    videoUnsupported: 'Your browser cannot play this video directly. Please download the file to watch.',

    // Bookshelf Modal
    modalBookshelfTitle: 'Bookshelf Management',
    inputPathLabel: 'Add Local Computer Folder Path',
    inputPathPlaceholder: 'e.g. D:\\Comics or /Users/name/Pictures',
    inputNamePlaceholder: 'Bookshelf Name (Optional, defaults to folder name)',
    btnAdd: 'Add',
    btnAdding: 'Adding...',
    quickDrivesLabel: 'Quick pick system drive / root:',
    addedShelvesLabel: 'Configured Bookshelves ({count})',
    noAddedShelves: 'No bookshelves added yet',
    btnDone: 'Done',
    confirmRemoveShelf: 'Are you sure you want to remove this folder from bookshelves? (Will not delete your local files)',

    // LAN Info Modal
    modalLanTitle: 'LAN Multi-Device Access',
    lanDesc: 'Make sure your tablet/phone is connected to the same Wi-Fi network as this PC. Open your browser and navigate to:',
    openLink: 'Open',
    touchTipsTitle: 'Touch Gesture Tips:',
    touchTip1: 'Swipe left/right or tap side 20% areas to turn pages',
    touchTip2: 'In dual-page mode, tap left or right page to turn pages',
    touchTip3: 'Double tap or pinch with two fingers to zoom in (Pinch-to-zoom)',
    touchTip4: 'Switch between LTR / RTL Manga and Waterfall scroll modes anytime',
    touchTip5: 'Turbo Mode accelerates image loading and optimizes video chunks',
    btnGotIt: 'Got it',

    // Settings Modal
    modalSettingsTitle: 'Settings & Preferences',
    languageSetting: 'Language / 语言',
    langZh: '简体中文 (Chinese)',
    langEn: 'English',
    readingPrefs: 'Reading Preferences',
    defaultReadingMode: 'Default Reading Mode',
    defaultDirection: 'Default Paged Direction',
    dirLTR: 'Left to Right (LTR / Albums)',
    dirRTL: 'Right to Left (RTL / Manga)',
    weakNetworkDesc: 'Turbo Mode: Optimizes image delivery, preloads forward pages, and smooths video streams',
    aboutApp: 'About',
    aboutDesc: 'Lightweight local comic, manga, album & video LAN reader built with FastAPI and Vue 3.'
  }
};

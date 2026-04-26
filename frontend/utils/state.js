/**
 * Global State Management
 * Quản lý trạng thái toàn cục cho ứng dụng SPA
 */
const AppState = {
    currentView: 'login',
    selectedArticle: null,
    user: null,
    articles: [],
    filteredArticles: [],
    currentPage: 1,
    articlesPerPage: 6,
    currentFilter: 'all',
    viewMode: 'grid',          // 'grid' | 'list'
    bookmarkedArticles: JSON.parse(localStorage.getItem('learnup_bookmarks') || '[]'),
    vocabularyList: [],
    showSavedOnly: false,      // Show only bookmarked articles
    activeTagFilters: [],      // Currently selected tag filters
    activeDifficultyFilter: null, // Currently selected difficulty filter
    
    // Quiz State
    currentQuiz: null,
    quizScore: 0,
    quizActiveQuestion: 0,
    quizResults: null
};

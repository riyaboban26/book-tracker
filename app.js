/**
 * BookTracker - Personal Reading Dashboard
 * A clean, accessible, modern Vanilla JavaScript reading list manager.
 * 
 * Features:
 * - LocalStorage data persistence with error handling
 * - Real-time validation with inline error messages
 * - Live search (title & author) with case-insensitivity
 * - Status filtering (All, To read, Reading, Finished)
 * - Dynamic dashboard statistics
 * - Accessible delete confirmation modal dialog
 * - Toast notification feedback
 * - Safe DOM manipulation (XSS-safe textContent)
 */

'use strict';

(function () {
  // ==========================================================================
  // 1. Constants & Application State
  // ==========================================================================

  const STORAGE_KEY = 'booktracker_library';
  const MAX_TITLE_LENGTH = 100;

  /**
   * Application state
   */
  const state = {
    books: [],             // Array of book objects: { id, title, author, status, createdAt }
    activeFilter: 'all',   // 'all' | 'To read' | 'Reading' | 'Finished'
    searchQuery: '',       // Current trimmed lowercase search query
    pendingDeleteId: null, // ID of book currently pending deletion in modal
    lastActiveElement: null // Store focus before opening modal to restore later
  };

  // ==========================================================================
  // 2. DOM Elements Cache
  // ==========================================================================

  const elements = {
    // Storage warning banner
    storageWarning: document.getElementById('storage-warning'),

    // Toast notification container
    toastContainer: document.getElementById('toast-container'),

    // Dashboard Statistics
    countTotal: document.getElementById('count-total'),
    countToRead: document.getElementById('count-toread'),
    countReading: document.getElementById('count-reading'),
    countFinished: document.getElementById('count-finished'),

    // Add Book Form
    addBookForm: document.getElementById('add-book-form'),
    bookTitleInput: document.getElementById('book-title'),
    bookAuthorInput: document.getElementById('book-author'),
    bookStatusSelect: document.getElementById('book-status'),
    titleError: document.getElementById('title-error'),
    authorError: document.getElementById('author-error'),
    titleCharCount: document.getElementById('title-char-count'),
    btnAddBook: document.getElementById('btn-add-book'),

    // Search and Filters
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterPills: document.querySelectorAll('.filter-pill'),
    libraryResultsCount: document.getElementById('library-results-count'),

    // Book List Container
    bookList: document.getElementById('book-list'),

    // Delete Modal Elements
    deleteModal: document.getElementById('delete-modal'),
    modalBookName: document.getElementById('modal-book-name'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete')
  };

  // ==========================================================================
  // 3. LocalStorage Persistence & Utilities
  // ==========================================================================

  /**
   * Detects whether browser localStorage is available and writable.
   * @returns {boolean} True if localStorage works; false otherwise.
   */
  function checkLocalStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const isStorageAvailable = checkLocalStorageAvailability();

  /**
   * Loads saved books from localStorage.
   * Gracefully handles corrupted JSON or missing records.
   * @returns {Array} Array of books
   */
  function loadBooksFromStorage() {
    if (!isStorageAvailable) {
      if (elements.storageWarning) {
        elements.storageWarning.hidden = false;
      }
      return [];
    }

    try {
      const serialized = window.localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return [];
      }
      const parsed = JSON.parse(serialized);
      if (Array.isArray(parsed)) {
        // Validate each item structure
        return parsed.filter(item => 
          item && 
          typeof item.id === 'string' && 
          typeof item.title === 'string' && 
          typeof item.author === 'string' && 
          typeof item.status === 'string'
        );
      }
      return [];
    } catch (err) {
      console.warn('BookTracker: Could not parse saved books from localStorage. Initializing empty list.', err);
      return [];
    }
  }

  /**
   * Saves current state.books array to localStorage.
   */
  function saveBooksToStorage() {
    if (!isStorageAvailable) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.books));
    } catch (err) {
      console.error('BookTracker: Failed to save books to localStorage:', err);
      showToast('Warning: Unable to save changes to browser storage.', 'error');
    }
  }

  /**
   * Generates a unique book ID.
   * Uses crypto.randomUUID when available, with a reliable fallback.
   * @returns {string} Unique ID
   */
  function generateUniqueId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // ==========================================================================
  // 4. Toast Notification System
  // ==========================================================================

  /**
   * Shows a brief non-intrusive notification toast.
   * @param {string} message - Message text to display.
   * @param {string} [type='success'] - 'success' | 'info' | 'error'
   */
  function showToast(message, type = 'success') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    // Safe SVG icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-message';
    textSpan.textContent = message; // textContent prevents XSS

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    elements.toastContainer.appendChild(toast);

    // Auto-remove toast from DOM after animation completes (3 seconds)
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 3000);
  }

  // ==========================================================================
  // 5. Dashboard Statistics Updates
  // ==========================================================================

  /**
   * Updates all dashboard statistics based on the ENTIRE library.
   * Note: The statistics represent the complete saved collection,
   * regardless of any active search queries or filters.
   */
  function updateDashboardStatistics() {
    const total = state.books.length;
    let toRead = 0;
    let reading = 0;
    let finished = 0;

    for (const book of state.books) {
      if (book.status === 'To read') {
        toRead++;
      } else if (book.status === 'Reading') {
        reading++;
      } else if (book.status === 'Finished') {
        finished++;
      }
    }

    elements.countTotal.textContent = String(total);
    elements.countToRead.textContent = String(toRead);
    elements.countReading.textContent = String(reading);
    elements.countFinished.textContent = String(finished);
  }

  // ==========================================================================
  // 6. Form Validation & Adding Books (Feature A)
  // ==========================================================================

  /**
   * Clears field validation errors.
   * @param {HTMLInputElement} inputEl
   * @param {HTMLElement} errorEl
   */
  function clearFieldError(inputEl, errorEl) {
    inputEl.classList.remove('input-error');
    inputEl.removeAttribute('aria-invalid');
    errorEl.textContent = '';
  }

  /**
   * Displays an inline validation error.
   * @param {HTMLInputElement} inputEl
   * @param {HTMLElement} errorEl
   * @param {string} message
   */
  function setFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    inputEl.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  /**
   * Handles the submission of the Add Book form.
   * @param {Event} event
   */
  function handleAddBookFormSubmit(event) {
    event.preventDefault(); // Prevent full page reload

    // Trim unnecessary leading and trailing whitespace
    const titleVal = elements.bookTitleInput.value.trim();
    const authorVal = elements.bookAuthorInput.value.trim();
    const statusVal = elements.bookStatusSelect.value || 'To read';

    let isValid = true;

    // Validate Title
    if (!titleVal) {
      setFieldError(elements.bookTitleInput, elements.titleError, 'Please enter a title');
      isValid = false;
    } else if (titleVal.length > MAX_TITLE_LENGTH) {
      setFieldError(elements.bookTitleInput, elements.titleError, `Title is too long (maximum ${MAX_TITLE_LENGTH} characters)`);
      isValid = false;
    } else {
      clearFieldError(elements.bookTitleInput, elements.titleError);
    }

    // Validate Author
    if (!authorVal) {
      setFieldError(elements.bookAuthorInput, elements.authorError, 'Please enter an author');
      isValid = false;
    } else {
      clearFieldError(elements.bookAuthorInput, elements.authorError);
    }

    // If validation fails, focus the first invalid field and stop
    if (!isValid) {
      if (!titleVal) {
        elements.bookTitleInput.focus();
      } else {
        elements.bookAuthorInput.focus();
      }
      return;
    }

    // Create new book item
    const newBook = {
      id: generateUniqueId(),
      title: titleVal,
      author: authorVal,
      status: statusVal,
      createdAt: Date.now()
    };

    // Add new book to the TOP of the array (newest first)
    state.books.unshift(newBook);

    // Persist changes
    saveBooksToStorage();

    // Update UI
    updateDashboardStatistics();
    renderBookList();

    // Reset Form
    elements.addBookForm.reset();
    elements.bookStatusSelect.value = 'To read';
    if (elements.titleCharCount) {
      elements.titleCharCount.textContent = `0/${MAX_TITLE_LENGTH}`;
      elements.titleCharCount.classList.remove('char-count-warn', 'char-count-max');
    }
    clearFieldError(elements.bookTitleInput, elements.titleError);
    clearFieldError(elements.bookAuthorInput, elements.authorError);

    // Show brief success toast
    showToast(`“${newBook.title}” was added to your library!`, 'success');
  }

  // ==========================================================================
  // 7. Book Rendering & Display (Features B, C, H)
  // ==========================================================================

  /**
   * Returns CSS class and text for a given status.
   * @param {string} status
   * @returns {{ className: string, label: string }}
   */
  function getStatusBadgeMeta(status) {
    switch (status) {
      case 'Reading':
        return { className: 'status-reading', label: 'Reading' };
      case 'Finished':
        return { className: 'status-finished', label: 'Finished' };
      case 'To read':
      default:
        return { className: 'status-toread', label: 'To Read' };
    }
  }

  /**
   * Formats a timestamp into a friendly readable date string.
   * @param {number} timestamp
   * @returns {string} e.g. "Added Oct 14, 2026"
   */
  function formatAddedDate(timestamp) {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return 'Added ' + date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  /**
   * Creates a single book card element.
   * STRICT SAFETY: Uses document.createElement and textContent for all user inputs.
   * Never sets innerHTML with raw user content to guarantee XSS prevention.
   * @param {Object} book
   * @returns {HTMLElement} Card element
   */
  function createBookCardElement(book) {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-id', book.id);

    // Top Section
    const topSection = document.createElement('div');

    // Header with Title and Status Badge
    const headerRow = document.createElement('div');
    headerRow.className = 'book-card-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'book-title';
    titleEl.textContent = book.title; // Safe textContent
    titleEl.title = book.title; // Accessible tooltip on hover

    const statusBadge = document.createElement('span');
    const badgeMeta = getStatusBadgeMeta(book.status);
    statusBadge.className = `status-badge ${badgeMeta.className}`;
    
    const dot = document.createElement('span');
    dot.className = 'badge-dot';
    dot.setAttribute('aria-hidden', 'true');
    statusBadge.appendChild(dot);

    const badgeText = document.createTextNode(badgeMeta.label);
    statusBadge.appendChild(badgeText);

    headerRow.appendChild(titleEl);
    headerRow.appendChild(statusBadge);

    // Author Row
    const authorEl = document.createElement('p');
    authorEl.className = 'book-author';

    const authorIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    authorIcon.setAttribute('class', 'author-icon');
    authorIcon.setAttribute('width', '16');
    authorIcon.setAttribute('height', '16');
    authorIcon.setAttribute('viewBox', '0 0 24 24');
    authorIcon.setAttribute('fill', 'none');
    authorIcon.setAttribute('stroke', 'currentColor');
    authorIcon.setAttribute('stroke-width', '2');
    authorIcon.setAttribute('stroke-linecap', 'round');
    authorIcon.setAttribute('stroke-linejoin', 'round');
    authorIcon.setAttribute('aria-hidden', 'true');
    authorIcon.innerHTML = `
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    `;

    const authorPrefix = document.createTextNode('by ');
    const authorNameSpan = document.createElement('span');
    authorNameSpan.textContent = book.author; // Safe textContent

    authorEl.appendChild(authorIcon);
    authorEl.appendChild(authorPrefix);
    authorEl.appendChild(authorNameSpan);

    // Meta (Date Added)
    const metaEl = document.createElement('p');
    metaEl.className = 'book-meta';
    metaEl.textContent = formatAddedDate(book.createdAt);

    topSection.appendChild(headerRow);
    topSection.appendChild(authorEl);
    if (book.createdAt) {
      topSection.appendChild(metaEl);
    }

    // Action Controls Row (Status Dropdown + Delete Button)
    const actionsRow = document.createElement('div');
    actionsRow.className = 'book-card-actions';

    // Status Select Wrapper
    const statusWrapper = document.createElement('div');
    statusWrapper.className = 'status-change-wrapper';

    const statusSelect = document.createElement('select');
    statusSelect.className = 'card-status-select';
    statusSelect.setAttribute('aria-label', `Change status for ${book.title}`);

    const options = [
      { value: 'To read', label: 'To read' },
      { value: 'Reading', label: 'Reading' },
      { value: 'Finished', label: 'Finished' }
    ];

    options.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      if (opt.value === book.status) {
        optionEl.selected = true;
      }
      statusSelect.appendChild(optionEl);
    });

    // Handle Status Change (Feature D)
    statusSelect.addEventListener('change', function () {
      handleBookStatusChange(book.id, statusSelect.value);
    });

    const arrowIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowIcon.setAttribute('class', 'card-status-arrow');
    arrowIcon.setAttribute('width', '14');
    arrowIcon.setAttribute('height', '14');
    arrowIcon.setAttribute('viewBox', '0 0 24 24');
    arrowIcon.setAttribute('fill', 'none');
    arrowIcon.setAttribute('stroke', 'currentColor');
    arrowIcon.setAttribute('stroke-width', '2');
    arrowIcon.setAttribute('stroke-linecap', 'round');
    arrowIcon.setAttribute('stroke-linejoin', 'round');
    arrowIcon.setAttribute('aria-hidden', 'true');
    arrowIcon.innerHTML = `<polyline points="6 9 12 15 18 9"></polyline>`;

    statusWrapper.appendChild(statusSelect);
    statusWrapper.appendChild(arrowIcon);

    // Delete Button (Feature E)
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-card-delete';
    deleteBtn.setAttribute('aria-label', `Delete book "${book.title}"`);

    const trashIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trashIcon.setAttribute('width', '15');
    trashIcon.setAttribute('height', '15');
    trashIcon.setAttribute('viewBox', '0 0 24 24');
    trashIcon.setAttribute('fill', 'none');
    trashIcon.setAttribute('stroke', 'currentColor');
    trashIcon.setAttribute('stroke-width', '2');
    trashIcon.setAttribute('stroke-linecap', 'round');
    trashIcon.setAttribute('stroke-linejoin', 'round');
    trashIcon.setAttribute('aria-hidden', 'true');
    trashIcon.innerHTML = `
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    `;

    const deleteText = document.createElement('span');
    deleteText.textContent = 'Delete';

    deleteBtn.appendChild(trashIcon);
    deleteBtn.appendChild(deleteText);

    // Open Delete Modal when clicked
    deleteBtn.addEventListener('click', function () {
      openDeleteModal(book.id, book.title, deleteBtn);
    });

    actionsRow.appendChild(statusWrapper);
    actionsRow.appendChild(deleteBtn);

    card.appendChild(topSection);
    card.appendChild(actionsRow);

    return card;
  }

  /**
   * Filters and renders the books collection.
   */
  function renderBookList() {
    if (!elements.bookList) return;

    // Clear current container safely
    elements.bookList.innerHTML = '';

    // If whole library is completely empty
    if (state.books.length === 0) {
      renderEmptyLibraryState();
      elements.libraryResultsCount.textContent = 'No books in library';
      return;
    }

    // Apply active filter and search query
    const filteredBooks = state.books.filter(book => {
      // 1. Status Filter
      if (state.activeFilter !== 'all' && book.status !== state.activeFilter) {
        return false;
      }
      // 2. Search Query (matches title OR author, case-insensitive, trimmed)
      if (state.searchQuery) {
        const titleMatch = book.title.toLowerCase().includes(state.searchQuery);
        const authorMatch = book.author.toLowerCase().includes(state.searchQuery);
        if (!titleMatch && !authorMatch) {
          return false;
        }
      }
      return true;
    });

    // Update results count label
    const totalCount = state.books.length;
    const matchCount = filteredBooks.length;
    if (state.searchQuery || state.activeFilter !== 'all') {
      elements.libraryResultsCount.textContent = `Showing ${matchCount} of ${totalCount} books`;
    } else {
      elements.libraryResultsCount.textContent = `Showing all ${totalCount} books`;
    }

    // If search/filter returned no results
    if (filteredBooks.length === 0) {
      renderNoSearchResultsState();
      return;
    }

    // Render cards (newest books first)
    // Note: state.books is maintained with newest first via unshift,
    // and sort order is preserved during filter.
    const fragment = document.createDocumentFragment();
    filteredBooks.forEach(book => {
      fragment.appendChild(createBookCardElement(book));
    });
    elements.bookList.appendChild(fragment);
  }

  /**
   * Renders the empty state when the user has not added any books yet.
   */
  function renderEmptyLibraryState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-state-icon';
    iconDiv.setAttribute('aria-hidden', 'true');
    iconDiv.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    `;

    const titleEl = document.createElement('h3');
    titleEl.className = 'empty-state-title';
    titleEl.textContent = 'Your reading library is empty';

    const descEl = document.createElement('p');
    descEl.className = 'empty-state-desc';
    descEl.textContent = 'Add your first book using the form on the left to start tracking your reading progress and habits.';

    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'btn btn-secondary empty-state-action';
    actionBtn.textContent = 'Add a Book Now';
    actionBtn.addEventListener('click', () => {
      elements.bookTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elements.bookTitleInput.focus();
    });

    emptyState.appendChild(iconDiv);
    emptyState.appendChild(titleEl);
    emptyState.appendChild(descEl);
    emptyState.appendChild(actionBtn);

    elements.bookList.appendChild(emptyState);
  }

  /**
   * Renders the empty state when search or status filter yields zero matches.
   */
  function renderNoSearchResultsState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-state-icon';
    iconDiv.setAttribute('aria-hidden', 'true');
    iconDiv.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    `;

    const titleEl = document.createElement('h3');
    titleEl.className = 'empty-state-title';
    titleEl.textContent = 'No matching books found';

    const descEl = document.createElement('p');
    descEl.className = 'empty-state-desc';

    if (state.searchQuery && state.activeFilter !== 'all') {
      descEl.textContent = `No books matching "${state.searchQuery}" with status "${state.activeFilter}". Try clearing your search query or choosing another filter.`;
    } else if (state.searchQuery) {
      descEl.textContent = `No books matching "${state.searchQuery}". Check for typos or try searching by author name.`;
    } else {
      descEl.textContent = `You have no books marked as "${state.activeFilter}". Change a book's status or choose a different filter.`;
    }

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-secondary empty-state-action';
    resetBtn.textContent = 'Clear Filters & Search';
    resetBtn.addEventListener('click', () => {
      resetFiltersAndSearch();
    });

    emptyState.appendChild(iconDiv);
    emptyState.appendChild(titleEl);
    emptyState.appendChild(descEl);
    emptyState.appendChild(resetBtn);

    elements.bookList.appendChild(emptyState);
  }

  // ==========================================================================
  // 8. Status Update (Feature D)
  // ==========================================================================

  /**
   * Updates a book's reading status.
   * @param {string} bookId
   * @param {string} newStatus - 'To read' | 'Reading' | 'Finished'
   */
  function handleBookStatusChange(bookId, newStatus) {
    const bookIndex = state.books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return;

    const book = state.books[bookIndex];
    if (book.status === newStatus) return;

    book.status = newStatus;

    // Persist changes
    saveBooksToStorage();

    // Update dashboard statistics
    updateDashboardStatistics();

    // Re-render list to reflect changes (and respect any active status filter)
    renderBookList();

    // Feedback
    showToast(`Updated status of “${book.title}” to ${newStatus}`);
  }

  // ==========================================================================
  // 9. Deleting Books & Modal (Feature E)
  // ==========================================================================

  /**
   * Opens the accessible delete confirmation modal.
   * @param {string} bookId
   * @param {string} bookTitle
   * @param {HTMLElement} triggerBtn
   */
  function openDeleteModal(bookId, bookTitle, triggerBtn) {
    state.pendingDeleteId = bookId;
    state.lastActiveElement = triggerBtn;

    elements.modalBookName.textContent = `“${bookTitle}”`;
    elements.deleteModal.hidden = false;

    // Focus cancel button for safe keyboard accessibility
    elements.btnCancelDelete.focus();

    // Attach modal keyboard listener (Escape key dismiss)
    window.addEventListener('keydown', handleModalKeyDown);
  }

  /**
   * Closes the delete confirmation modal.
   */
  function closeDeleteModal() {
    state.pendingDeleteId = null;
    elements.deleteModal.hidden = true;
    window.removeEventListener('keydown', handleModalKeyDown);

    // Restore focus to the trigger button
    if (state.lastActiveElement && typeof state.lastActiveElement.focus === 'function') {
      state.lastActiveElement.focus();
    }
    state.lastActiveElement = null;
  }

  /**
   * Keyboard handler for modal dialog.
   * @param {KeyboardEvent} event
   */
  function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
      closeDeleteModal();
    }
  }

  /**
   * Confirms deletion of the pending book.
   */
  function confirmDeleteBook() {
    const bookId = state.pendingDeleteId;
    if (!bookId) {
      closeDeleteModal();
      return;
    }

    const bookToDelete = state.books.find(b => b.id === bookId);
    const bookTitle = bookToDelete ? bookToDelete.title : 'Book';

    // Remove book from collection
    state.books = state.books.filter(b => b.id !== bookId);

    // Save and update
    saveBooksToStorage();
    updateDashboardStatistics();
    renderBookList();

    closeDeleteModal();
    showToast(`Removed “${bookTitle}” from your library`);
  }

  // ==========================================================================
  // 10. Search & Filter Handlers (Features C & H)
  // ==========================================================================

  /**
   * Handles user typing in the search input.
   */
  function handleSearchInput() {
    const rawVal = elements.searchInput.value;
    const trimmedVal = rawVal.trim().toLowerCase();

    state.searchQuery = trimmedVal;

    // Show or hide clear button
    if (rawVal.length > 0) {
      elements.btnClearSearch.hidden = false;
    } else {
      elements.btnClearSearch.hidden = true;
    }

    renderBookList();
  }

  /**
   * Clears the search input and restores filtered list.
   * Does NOT reset the selected status filter.
   */
  function handleClearSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.btnClearSearch.hidden = true;
    elements.searchInput.focus();
    renderBookList();
  }

  /**
   * Handles status filter pill clicks.
   * @param {string} filterValue
   * @param {HTMLButtonElement} clickedPill
   */
  function handleFilterSelect(filterValue, clickedPill) {
    state.activeFilter = filterValue;

    elements.filterPills.forEach(pill => {
      const isSelected = (pill === clickedPill);
      pill.classList.toggle('active', isSelected);
      pill.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    renderBookList();
  }

  /**
   * Resets both search query and status filter to initial states.
   */
  function resetFiltersAndSearch() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.btnClearSearch.hidden = true;

    state.activeFilter = 'all';
    elements.filterPills.forEach(pill => {
      const isAll = pill.dataset.filter === 'all';
      pill.classList.toggle('active', isAll);
      pill.setAttribute('aria-checked', isAll ? 'true' : 'false');
    });

    renderBookList();
  }

  // ==========================================================================
  // 11. Event Listeners Registration
  // ==========================================================================

  function setupEventListeners() {
    // Add Book Form
    elements.addBookForm.addEventListener('submit', handleAddBookFormSubmit);

    // Live input error clearing and character count tracking
    elements.bookTitleInput.addEventListener('input', function () {
      const currentLen = elements.bookTitleInput.value.length;
      if (elements.titleCharCount) {
        elements.titleCharCount.textContent = `${currentLen}/${MAX_TITLE_LENGTH}`;
        elements.titleCharCount.classList.toggle('char-count-warn', currentLen >= 80 && currentLen < MAX_TITLE_LENGTH);
        elements.titleCharCount.classList.toggle('char-count-max', currentLen >= MAX_TITLE_LENGTH);
      }

      const trimmedVal = elements.bookTitleInput.value.trim();
      if (trimmedVal.length > 0 && trimmedVal.length <= MAX_TITLE_LENGTH) {
        clearFieldError(elements.bookTitleInput, elements.titleError);
      } else if (trimmedVal.length > MAX_TITLE_LENGTH) {
        setFieldError(elements.bookTitleInput, elements.titleError, `Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      }
    });

    elements.bookAuthorInput.addEventListener('input', function () {
      if (elements.bookAuthorInput.value.trim().length > 0) {
        clearFieldError(elements.bookAuthorInput, elements.authorError);
      }
    });

    // Search Box
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.btnClearSearch.addEventListener('click', handleClearSearch);

    // Status Filter Pills
    elements.filterPills.forEach(pill => {
      pill.addEventListener('click', function () {
        const filterVal = pill.getAttribute('data-filter') || 'all';
        handleFilterSelect(filterVal, pill);
      });
    });

    // Delete Modal Actions
    elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
    elements.btnConfirmDelete.addEventListener('click', confirmDeleteBook);

    // Close modal if user clicks outside modal card on the backdrop
    elements.deleteModal.addEventListener('click', function (event) {
      if (event.target === elements.deleteModal) {
        closeDeleteModal();
      }
    });
  }

  // ==========================================================================
  // 12. Application Initialization
  // ==========================================================================

  function init() {
    // 1. Load saved data from localStorage
    state.books = loadBooksFromStorage();

    // 2. Setup DOM event listeners
    setupEventListeners();

    // 3. Update dashboard counts
    updateDashboardStatistics();

    // 4. Render initial book list or empty state
    renderBookList();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

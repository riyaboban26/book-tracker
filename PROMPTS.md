# Prompt Log: Book Tracker

This document records all the prompts used to build the **BookTracker** web application step by step, following the vibe coding loop. After each prompt, it documents what was asked and what happened, including a case where the AI made a mistake and how it was noticed and fixed.

---

### Prompt 1: Planning the Project
**Prompt 1:** *"I want to build a Book Tracker web page using plain HTML, CSS and JavaScript. Features: add a book with title, author and status (To read, Reading, Finished), show the list newest first, search, change status, and keep the data after a refresh. Before writing any code, list the files you will create and explain how the data will be saved."*

**What happened:** The AI outlined the application structure without writing premature code. It proposed three separate files:
- `index.html` for semantic structure and accessible elements.
- `style.css` for a modern warm cream (`#F8F6F0`) and dark forest green (`#1B4332`) design.
- `app.js` for state management, DOM rendering, and logic.
It explained that data would be saved in the browser's native `localStorage` as a serialized JSON array under the key `'booktracker_library'`, with each book having an ID, title, author, status, and creation timestamp.

---

### Prompt 2: Page Layout & Header
**Prompt 2:** *"Create the initial layout in index.html and style.css. Add a clean header with the name BookTracker, a small book icon, and a short tagline. Use a soft cream background and dark green as the primary accent color."*

**What happened:** The AI generated the foundation of `index.html` and `style.css`. It styled the canvas with `#F8F6F0`, added a sticky header with an SVG book icon, and created a responsive `.container` system. It also defined CSS custom properties for colors, shadows, border radiuses, and typography (`Plus Jakarta Sans` and `Playfair Display`).

---

### Prompt 3: Add Book Form & List Display
**Prompt 3:** *"Create the Add Book form in index.html and write the JavaScript in app.js so that when I click Add, the book appears at the top of the list. Book title and author name are required. If the title is empty, display 'Please enter a title' beneath the title input. If the author is empty, display 'Please enter an author' beneath the author input. Show newest books first."*

**What happened:** The AI created the form with Title, Author, and a Status dropdown (`To read`, `Reading`, `Finished`). In `app.js`, it attached a `submit` event listener, prevented page refresh with `e.preventDefault()`, trimmed inputs, and displayed the exact required inline error messages if validation failed. It used `state.books.unshift(newBook)` to ensure newly added books appear at the top, and used `element.textContent` to prevent XSS injection.

---

### Prompt 4: Saving Data in localStorage (Where the AI Made a Mistake)
**Prompt 4:** *"Save the book list in localStorage so it is still there after a refresh. Load the saved list when the page opens."*

**What happened:** Books were saved, but the status went back to "To read" after a refresh. I added a book with the status set to "Finished", but when I refreshed the page, the book showed up with the status "To read". I inspected the code and noticed the AI had written:
```javascript
// What the AI wrote:
const newBook = {
  id: generateUniqueId(),
  title: titleVal,
  author: authorVal,
  status: 'To read', // BUG: Hardcoded instead of reading the dropdown value!
  createdAt: Date.now()
};
```
I told the AI that the status was not being saved correctly from the dropdown and that it was resetting to "To read" on refresh. The AI fixed it by reading the actual selected dropdown value:
```javascript
// Fixed code:
const statusVal = elements.bookStatusSelect.value || 'To read';
const newBook = {
  id: generateUniqueId(),
  title: titleVal,
  author: authorVal,
  status: statusVal, // Fixed: Correctly saves selected status
  createdAt: Date.now()
};
```
After this fix, I added a book as "Finished", refreshed the page, and verified that the status stayed "Finished".

---

### Prompt 5: Live Search by Title or Author
**Prompt 5:** *"Add a search box above the book list. As I type, filter the list to show only books whose title or author contains the search text. Make the search case-insensitive so searching for 'BEN' finds a book written by 'Benyamin'. Add a clear button to easily reset the search."*

**What happened:** The AI added an `<input type="search" id="search-input">` with an embedded search icon and a clear button (`✕`). In `app.js`, it added an `input` event listener that converts both the search query and the book title/author to lowercase using `.toLowerCase().trim()`. I tested typing `"BEN"` in uppercase, and it successfully matched author `"Benyamin"`. Clicking the clear button cleared the query and restored the full list.

---

### Prompt 6: Status Filter Buttons
**Prompt 6:** *"Add status filter buttons above the list for: All Books, To Read, Reading, and Finished. The selected filter should be visually highlighted. Make sure searching and filtering work together, and that clearing the search does not reset the selected status filter."*

**What happened:** The AI added a pill-style filter bar. It maintained `state.activeFilter` and updated the active class and `aria-checked` attributes on the clicked button. In `renderBookList()`, it combined both filters: first filtering by `state.activeFilter`, then filtering by `state.searchQuery`. In `handleClearSearch()`, it only cleared the search input without altering `state.activeFilter`, ensuring the selected filter remains active.

---

### Prompt 7: Changing a Book's Status
**Prompt 7:** *"Allow users to change a book's status directly from its card at any time between To read, Reading, and Finished. Update the status badge immediately and save the change in localStorage."*

**What happened:** The AI added a `<select>` dropdown inside each rendered book card with the three options. When changed, it triggers `handleBookStatusChange(book.id, newStatus)`, which updates the book in the array, updates the status badge CSS class and label (blue for To read, amber for Reading, green for Finished), persists the change to `localStorage`, and displays a brief confirmation toast message.

---

### Prompt 8: Deleting Books with Confirmation Modal
**Prompt 8:** *"Add a Delete button to each book card. Ask for confirmation before deleting a book using a clean modal dialog so books aren't deleted by accident. Support pressing the Escape key to cancel."*

**What happened:** The AI added a Delete button with a trash icon to each card. It built an accessible modal dialog (`#delete-modal`) with a backdrop blur overlay. When Delete is clicked, the modal opens showing the title of the book to be removed. Pressing `Escape` or clicking "Cancel" closes the modal safely without deleting anything. Clicking "Yes, Delete Book" removes the book from `state.books`, updates `localStorage`, re-renders the list, and restores focus.

---

### Prompt 9: Dashboard Statistics
**Prompt 9:** *"Add four summary cards at the top displaying: Total Books, To Read, Reading, and Finished. Calculate all counts from the saved data and update them whenever books are added, deleted, or have their status changed. Keep the statistics accurate even when a search or filter is active."*

**What happened:** The AI added four stat cards with dedicated SVG icons and counters (`#count-total`, `#count-toread`, `#count-reading`, `#count-finished`). In `updateDashboardStatistics()`, it counts items across the entire `state.books` array (the complete library) rather than the visible filtered subset, ensuring total library counts remain accurate while searching or filtering.

---

### Prompt 10: Mobile Responsiveness & Polish
**Prompt 10:** *"Make sure the application is fully responsive and looks great on mobile phones. Ensure cards handle very long titles without breaking the layout, and add an attractive empty state when no books match."*

**What happened:** The AI added CSS media queries in `style.css` for tablet (`900px`), mobile (`640px`), and narrow screens (`380px`). The stat grid and form adjust from multi-column to single-column, and buttons expand to full touch-friendly widths. It added `word-break: break-word` and `overflow-wrap: break-word` to handle long titles. It also implemented two distinct empty states: one for an empty library, and one when no books match an active search or filter.

---

## Final Self-Testing Checklist

Before submitting, the project was tested against all requirements:
- [x] **Empty title validation**: Clicked Add with an empty title -> showed *"Please enter a title"* under the box.
- [x] **Empty author validation**: Clicked Add with an empty author -> showed *"Please enter an author"* under the box.
- [x] **Whitespace trimming**: Entered titles and authors with extra spaces -> spaces were trimmed cleanly.
- [x] **Very long title**: Added a 250-character title -> text wrapped inside the card without breaking layout.
- [x] **Capital letters search**: Typed `"BEN"` -> successfully found book by author *"Benyamin"*.
- [x] **Status updates**: Changed status from "To read" to "Reading" to "Finished" -> badges and counts updated immediately.
- [x] **Page refresh**: Pressed `F5` -> all books, updated statuses, and counts persisted from `localStorage`.
- [x] **Mobile layout**: Tested at 375px width -> clean single-column layout with no horizontal scrollbar.
- [x] **Delete confirmation**: Clicked Delete -> modal appeared; tested cancel and confirm deletion.

# BookTracker 📚

A modern, responsive personal reading dashboard built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript**. **BookTracker** allows book lovers to organize their personal reading collection, track reading progress in real time, quickly search and filter titles, and securely persist reading history across browser sessions using `localStorage`—all with zero external frameworks or dependencies.

---

## 🌟 Overview & Architecture

BookTracker is built around the aesthetic of a quiet, warm personal library study, combining refined typography with an intuitive desktop and mobile dashboard layout.

### Layout Design
- **Two-Column Workspace (`workspace-grid`)**:
  - **Sticky Left Sidebar (`sidebar-column`)**: Houses the **"Add a New Book"** form with real-time character counting, inline validation, and status selection. Stays anchored on screen as users scroll through their collection.
  - **Main Library Area (`main-column`)**: Gives primary focus to the reading collection, featuring live search, status filter pills, dynamic result counters, and a multi-column responsive book card grid.
- **Top Statistics Overview**: An elevated four-metric summary bar displaying live counters for *Total Books*, *To Read*, *Reading*, and *Finished*.
- **Color System**: Soft cream canvas (`#F8F6F0`) paired with deep forest green accents (`#1B4332`), warm emerald (`#2D6A4F`), amber, and slate status indicators.
- **Typography**: Editorial serif headings (`Playfair Display`) paired with clean, legible geometric sans-serif UI controls (`Plus Jakarta Sans`).

---

## ✨ Features & Implementation Details

### 1. Add New Books with Real-Time Validation & Character Limits
- **Required Fields**: Book Title and Author Name.
- **Reading Status Selector**: Dropdown options for `To read`, `Reading`, and `Finished` (defaults to `To read`).
- **Character Limit Guard**:
  - Book titles are capped at a maximum of **100 characters** via `maxlength="100"` and JavaScript submission validation.
  - **Live Character Counter (`0/100`)**: Displays active character count beside the label, dynamically shifting to amber at 80+ characters and red at the 100-character ceiling.
- **Inline Error Feedback**:
  - Displays *"Please enter a title"* if the title field is blank or only whitespace.
  - Displays *"Please enter an author"* if the author field is blank or only whitespace.
  - Displays *"Title is too long (maximum 100 characters)"* if boundary limits are breached.
  - Clears error messages automatically as soon as the user resumes typing.
- **Sanitization & Ordering**:
  - Automatically trims leading and trailing whitespace.
  - Generates unique record IDs via `crypto.randomUUID()` (with timestamp-random fallback).
  - Prepends newly added books to the top of the collection (newest first).
  - Displays a non-intrusive toast notification on successful addition.

### 2. Reading Dashboard Statistics
Dynamic summary cards track reading habits across the entire collection:
- **Total Books**: Cumulative count of all stored books.
- **To Read**: Books queued for future reading.
- **Reading**: Books currently in progress.
- **Finished**: Completed books.
*Note: Dashboard statistics reflect the complete saved collection, remaining consistent even when temporary search queries or filter pills are applied.*

### 3. Card Management & Multi-Line Clamping
- Each book is rendered in an elevated card showing title, author, visual status badge, date added, a quick-change status dropdown, and a delete button.
- **Visual Status Badges**:
  - 🔵 **To Read** (Slate blue badge)
  - 🟡 **Reading** (Warm amber badge)
  - 🟢 **Finished** (Lush forest green badge)
- **Title Overflow Protection**: Book titles wrap cleanly and use CSS multi-line clamping (`-webkit-line-clamp: 3`) to ensure long titles never distort card geometry. An accessible HTML `title` tooltip allows inspecting the complete title on hover.

### 4. Instant Live Search
- Search across books by **Title** or **Author Name**.
- Case-insensitive matching (e.g., searching `"BEN"` matches *"Goat Days"* by *"Benyamin"*).
- Instant filtering on every keystroke with no search button required.
- Integrated one-click clear button (`✕`) appears while typing.
- Fully compatible with active status filters.

### 5. Status Filtering
- Segmented filter pills: **All Books**, **To Read**, **Reading**, and **Finished**.
- Active filter pill is highlighted with an emerald badge and `aria-checked="true"`.
- Combines seamlessly with active search queries.
- Clearing the search box preserves the currently selected status filter.

### 6. Quick Status Updating
- Change any book's status on the fly using the dropdown selector on its card.
- Instantly updates card badges, dashboard summary counters, and persistent storage.
- Shows a confirmation toast notification upon status change.

### 7. Delete Confirmation Dialog
- Clicking "Delete" opens a confirmation modal dialog (`role="dialog"`, `aria-modal="true"`) to prevent accidental data loss.
- Displays the specific book title to confirm removal.
- **Keyboard & Focus Handling**:
  - Closes on `Escape` key press or when clicking the backdrop overlay.
  - Sets initial focus on the "Cancel" button to prevent accidental trigger on `Enter`.
  - Restores focus to the triggering delete button upon dialog dismissal.
- Clicking "Yes, Delete Book" removes the item, updates dashboard statistics, and displays a toast message.

### 8. Context-Aware Empty States
- **Empty Library**: Friendly message and an "Add a Book Now" button that scrolls and focuses the title input in the sidebar.
- **No Search/Filter Results**: Explains why no records matched the active filter/query and provides a single-click "Clear Filters & Search" button.

### 9. Security & Accessibility (a11y)
- **XSS Prevention**: DOM elements are constructed using `document.createElement`, `textContent`, and safe DOM node appending. Raw user input is never parsed through `innerHTML`.
- **Keyboard Navigation**: Interactive controls include visible `:focus-visible` outline rings for keyboard navigation.
- **ARIA Standards**: Utilizes semantic roles and attributes including `role="dialog"`, `role="radiogroup"`, `role="radio"`, `role="alert"`, `aria-live`, and `aria-describedby`.

---

## 🛠️ Technology Stack

| Technology | Implementation Scope |
| :--- | :--- |
| **HTML5** | Semantic structure using `<header>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, form controls, and accessible ARIA attributes. |
| **CSS3** | Vanilla CSS using custom properties (CSS variables), CSS Grid (2-column workspace & auto-fill card grid), Flexbox, sticky positioning, line clamping, and responsive media queries. Zero CSS frameworks. |
| **JavaScript (ES6+)** | Pure Vanilla JavaScript encapsulated in an IIFE (`'use strict'`), reactive state management, DOM event listeners, and safe node creation. Zero external dependencies. |
| **Web Storage API** | Browser `localStorage` for offline-first persistence with storage availability detection and graceful fallbacks. |

---

## 📁 Project File Structure

```text
book-tracker/
│
├── index.html        # Semantic markup, sidebar form, library grid, modal markup
├── style.css         # Design system tokens, sidebar layout, responsive breakpoints
├── app.js            # State management, validation, DOM rendering, localStorage logic
├── README.md         # Comprehensive project documentation
└── PROMPTS.md        # AI prompt logs, development history, and iteration records
```

---

## 🚀 How to Run Locally

Because BookTracker is built with native web standards with no build tools or package managers required, you can launch it using any of the following methods:

### Method 1: Direct File Launch (Fastest)
1. Clone or download this repository.
2. Locate `index.html` in your file explorer.
3. Double-click `index.html` to open it directly in any modern browser (Chrome, Edge, Firefox, Safari).
   - *Windows PowerShell shortcut*:
     ```powershell
     Start-Process "index.html"
     ```

### Method 2: Python Local HTTP Server (Recommended)
1. Open terminal or PowerShell in the project directory.
2. Run Python's built-in server:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:8080
   ```

### Method 3: Node.js (`npx serve`)
If you have Node.js installed, start a lightweight static server:
```bash
npx serve .
```

### Method 4: VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click `index.html` in the Explorer pane.
3. Select **Open with Live Server**.

---

## 💾 Understanding `localStorage` Persistence

### How Data is Stored
- Book items are stored as a serialized JSON array under the key `'booktracker_library'`:
  ```javascript
  localStorage.setItem('booktracker_library', JSON.stringify(state.books));
  ```
- On initial page load, the stored string is parsed and validated:
  ```javascript
  const saved = JSON.parse(localStorage.getItem('booktracker_library'));
  ```

### Storage Characteristics
- **Persistence**: Saved books persist across tab closures, browser restarts, and system reboots.
- **Domain & Browser Scoped**: Data is scoped to the specific browser profile and origin (`localhost` or GitHub Pages domain).
- **Graceful Error Handling**: If a user's browser disables storage (such as strict private browsing or disabled cookies), an accessibility warning banner is shown at the top of the page notifying them that data will persist for the active session only.

---

## 🌐 Deploying to GitHub Pages

BookTracker can be hosted for free on GitHub Pages with zero build configuration:

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Complete BookTracker application"
git branch -M main
git remote add origin https://github.com/riyaboban26/book-tracker.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. On GitHub, navigate to your repository's **Settings** tab.
2. In the left navigation menu, click **Pages** (under *Code and automation*).
3. Under **Build and deployment** > **Branch**:
   - Choose `main` from the branch dropdown.
   - Ensure the folder is set to `/(root)`.
   - Click **Save**.
4. Allow 1–2 minutes for GitHub to publish the site. Your live deployment will be accessible at:
   ```text
   https://riyaboban26.github.io/book-tracker/
   ```

---

## 🔍 Engineering Considerations & Limitations

1. **Client-Side Storage Scope**: Data is stored in client-side `localStorage`, meaning reading lists are private to the user's specific browser and do not sync across different physical devices without an external cloud backend.
2. **Storage Quota**: Browser `localStorage` typically provides ~5MB of storage per origin. For text-based book records, this easily accommodates thousands of titles, but is not designed for binary data or raw image files.
3. **Private Browsing Lifecycles**: In strict incognito or private browsing sessions, browsers wipe `localStorage` caches once all private session windows close.

---

## 🧪 Verification & Manual Testing Scenarios

The following scenarios were manually validated across desktop and mobile viewports:
- [x] **Empty Input Validation**: Submitting without title or author displays corresponding inline error messages.
- [x] **Character Length Ceiling**: Verifying typing and pasting up to 100 characters; live counter updates, shifts to warning color at 80+, and enforces hard stop at 100 characters.
- [x] **Whitespace Handling**: Entries with extraneous spaces are trimmed cleanly.
- [x] **Two-Column Layout & Sticky Sidebar**: Verifying form sticks during scrolling on desktop (screens ≥ 1024px) and collapses gracefully into a stacked layout on tablets and mobile screens.
- [x] **Search & Filter Concurrency**: Searching for partial strings (case-insensitive) while a status filter is selected filters correctly without clearing the active filter.
- [x] **Status Progression**: Updating status via card dropdown updates the badge color, summary cards, and storage in real time.
- [x] **Delete Confirmation**: Deleting a book prompts modal confirmation; Escape key or Cancel button cancels without deletion; confirming removes record and updates counters.
- [x] **Persistence Check**: Refreshing (`F5`) or reopening the browser retains all records and status counts intact.

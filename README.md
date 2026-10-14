# BookTracker 📚

A clean, modern, and beginner-friendly personal reading dashboard built with pure HTML5, CSS3, and Vanilla JavaScript. **BookTracker** allows users to organize their personal library, monitor their reading progress, filter and search through books, and securely preserve their reading history across browser sessions using `localStorage`.

---

## 🌟 Overview & Design Aesthetic

BookTracker is designed around the visual metaphor of a quiet, warm personal study.
- **Color Palette**: Calming soft cream (`#F8F6F0`) canvas with a deep forest green (`#1B4332`) primary accent, complemented by warm amber, sage, and slate tones for status badges.
- **Typography**: Clean, readable typography pairing `Plus Jakarta Sans` for responsive UI controls with `Playfair Display` for refined editorial headings.
- **Aesthetic Elements**: Soft elevation shadows, subtle border lines, rounded cards (`border-radius: 16px`), micro-interactions on hover/focus, and accessible modal confirmation dialogs.

---

## ✨ Features

### 1. Add New Books
- Required fields for **Book Title** and **Author Name**.
- Dropdown selector for **Reading Status** with three options: `To read`, `Reading`, and `Finished` (defaults to `To read`).
- Inline real-time validation:
  - Displays *"Please enter a title"* if the title field is blank or contains only whitespace.
  - Displays *"Please enter an author"* if the author field is blank or contains only whitespace.
  - Automatically clears validation error messages as soon as the user resumes typing.
- Leading and trailing whitespace is automatically trimmed.
- New books are automatically assigned a unique ID (`crypto.randomUUID()` with fallback) and a creation timestamp.
- Newly added books are placed at the **top** of the list (newest first).
- Instant, non-intrusive toast notification confirms successful addition.

### 2. Reading Dashboard Statistics
Dynamic summary cards display real-time counters:
- **Total Books**: Total count of all books in your library.
- **To Read**: Books queued for future reading.
- **Reading**: Books currently in progress.
- **Finished**: Completed books.
*Note: Dashboard statistics always reflect your entire library collection, even when active searches or filters are applied.*

### 3. Display & Card Management
- Each book is presented in an elevated card showing title, author, reading status badge, date added, a quick status dropdown, and a delete button.
- Handles exceptionally long titles and author names with CSS word wrapping (`break-word` / `overflow-wrap`) without disrupting card alignment.
- Visual status badges:
  - 🔵 **To Read** (Soft blue / slate badge)
  - 🟡 **Reading** (Warm amber badge)
  - 🟢 **Finished** (Lush forest green badge)

### 4. Live Search
- Search through books by **Title** or **Author Name**.
- Case-insensitive (e.g., searching `"BEN"` finds *"Goat Days"* by *"Benyamin"*).
- Instant live filtering as you type.
- Integrated clear button (`✕`) appears when typing, allowing one-click query clearing.
- Works in tandem with status filters.

### 5. Status Filtering
- Filter tabs: **All Books**, **To Read**, **Reading**, **Finished**.
- Selected filter is visually highlighted with a solid forest green pill.
- Seamlessly combines with search queries.
- Clearing or resetting search keeps the currently selected status filter active.

### 6. Update Reading Status
- Change any book's status on-the-fly using the card dropdown selector.
- Updates the card badge, dashboard counts, and browser storage immediately.

### 7. Delete Books with Confirmation Dialog
- Clicking "Delete" displays an accessible modal dialog preventing accidental removals.
- Features keyboard accessibility (supports Escape key dismiss and focus trap).
- Clicking "Yes, Delete Book" removes the item, updates counts, and displays a confirmation toast.

### 8. Empty States
- **Empty Library**: Helpful message and quick-action button when no books have been added yet.
- **No Search/Filter Results**: Clear explanation when no books match the active query/filter with a single-click "Clear Filters & Search" button.

### 9. Security & Accessibility
- **XSS Prevention**: Safe DOM construction using `document.createElement` and `textContent`. User input is never injected into `innerHTML`.
- **Keyboard Navigation**: Complete keyboard accessibility with visible `:focus-visible` outline rings.
- **Screen Reader Support**: Accessible ARIA labels (`aria-label`, `aria-describedby`, `role="radiogroup"`, `role="dialog"`).

---

## 🛠️ Technologies Used

- **HTML5**: Semantic elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<aside>`, `<dialog>`).
- **CSS3**: Custom properties (CSS variables), CSS Grid, Flexbox, media queries for responsive layouts, subtle animations. No CSS frameworks used.
- **Vanilla JavaScript (ES6+)**: Clean, modular code, event delegation, DOM manipulation, state management. No libraries or frameworks used.
- **Browser localStorage**: Native client-side key-value storage for offline persistence.

---

## 📁 Project File Structure

```text
book-tracker/
│
├── index.html        # Semantic page structure, forms, templates, accessible modal
├── style.css         # Modern design system, CSS variables, responsive layout
├── app.js            # Vanilla JavaScript logic, state, storage, search, filter
├── README.md         # Comprehensive project documentation
└── PROMPTS.md        # AI prompt logs, testing history, and development notes
```

---

## 🚀 Instructions for Running Locally

Because BookTracker uses standard static web technologies with no build steps or backend servers, you can run it in multiple ways:

### Option 1: Direct Browser Launch
1. Clone or download this repository to your local machine.
2. Locate `index.html` in the project root folder.
3. Double-click `index.html` (or right-click and choose **Open with** > **Google Chrome**, **Mozilla Firefox**, **Microsoft Edge**, or **Safari**).

### Option 2: Using Python's Built-in HTTP Server (Recommended)
1. Open your terminal or PowerShell.
2. Navigate to the project root directory:
   ```bash
   cd path/to/book-tracker
   ```
3. Start the local server:
   ```bash
   python -m http.server 8080
   ```
4. Open your browser and navigate to:
   ```text
   http://localhost:8080
   ```

### Option 3: Using Node.js `npx serve`
```bash
npx serve .
```

---

## 💾 Understanding `localStorage`

### How It Works
`localStorage` is a native web browser API that stores key-value pairs locally on the user's computer. In BookTracker:
- Books are serialized into a JSON string and saved under the key:
  ```javascript
  localStorage.setItem('booktracker_library', JSON.stringify(books));
  ```
- When the page is refreshed or reopened, the stored string is parsed back into JavaScript objects:
  ```javascript
  const books = JSON.parse(localStorage.getItem('booktracker_library'));
  ```

### Storage Characteristics
- **Persistence**: Data remains saved even after closing the tab, quitting the browser, or rebooting your computer.
- **Browser-Specific**: Data is tied to the specific browser and profile where it was entered (e.g., books added in Chrome will not automatically show up in Firefox).
- **Domain-Specific**: Data is scoped to the specific protocol and origin (`localhost:8080` or your GitHub Pages URL).
- **No Cloud Synchronization**: Data is stored strictly on your local machine and is not synchronized across multiple computers or mobile phones.
- **Availability Warning**: If `localStorage` is disabled (such as certain private browsing modes or restricted enterprise environments), BookTracker displays a top banner informing the user that data will only persist for the current session.

---

## 🌐 Publishing to GitHub Pages (Free Hosting)

Follow these steps to deploy BookTracker for free on GitHub Pages:

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. In the top-right corner, click **+** and select **New repository**.
3. Name your repository (e.g., `book-tracker`).
4. Keep the repository **Public**.
5. Do not initialize with a README if you are pushing existing files.
6. Click **Create repository**.

### Step 2: Push Local Files to GitHub
In your local project folder, run the following commands:
```bash
git init
git add .
git commit -m "Initial commit: Complete BookTracker application"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/book-tracker.git
git push -u origin main
```
*(Replace `<YOUR-USERNAME>` with your actual GitHub username).*

### Step 3: Enable GitHub Pages
1. On GitHub, navigate to your repository's **Settings** tab.
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment** > **Branch**:
   - Select `main` from the dropdown branch menu.
   - Leave the folder set to `/(root)`.
   - Click **Save**.
4. Wait 1–2 minutes. Refresh the page to see your live site link:
   ```text
   https://<YOUR-USERNAME>.github.io/book-tracker/
   ```

---

## ⚠️ Known Limitations

1. **Client-Side Scope**: Because there is no external database or user authentication, your reading list cannot be shared directly with friends via a link or synced between your desktop and smartphone.
2. **Storage Quota**: Browser `localStorage` typically has a storage quota of approximately 5MB per domain. For text-based book records, this easily accommodates thousands of titles, but cannot store high-resolution book cover images directly.
3. **Private Browsing Mode**: In some browsers operating in strict incognito or private browsing modes, `localStorage` data may be wiped once all private windows are closed.

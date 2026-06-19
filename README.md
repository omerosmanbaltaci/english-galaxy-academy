# English Galaxy Academy - Phase 1 MVP

Welcome to the **English Galaxy Academy** public website MVP codebase. This project serves as a highly scalable, serverless, curriculum-driven English language learning resource center.

---

## 🌌 Project Overview

English Galaxy Academy is designed to support school students following the Turkish Ministry of National Education (MEB) curriculum (Grades 1-12) as well as independent general English learners (A1-C1 CEFR). 

This codebase represents **Phase 1: Public Website MVP**, delivering the entire client-facing experience, fully styled and operational with dynamic search and Markdown content rendering.

---

## 🛠️ Technology Stack

* **Structure**: Semantic HTML5 with SEO meta elements, Open Graph tags, and indexable layouts.
* **Styling**: Vanilla CSS3 Custom Properties (Design System, HSL colors, dark mode support, fluid grid system).
* **Interactivity**: Vanilla ES6 JavaScript (Header/Footer layout injection, hamburger toggle, and client-side page configurations).
* **Content Engine**: Markdown files parsed with YAML frontmatter meta fields.
* **Markdown Renderer**: [marked.js](https://marked.js.org/) compiled client-side via CDN.
* **Search System**: Instantly processed, zero-server client-side search index (`content/search-index.json`).

---

## 📁 Directory Structure

```
├── docs/                                  # Project specifications (MD files)
├── content/                               # Markdown Content Store
│   ├── primary/
│   │   └── grade-1/                       # Grade-1 unit lessons, worksheets, flashcards, quizzes
│   ├── middle-school/
│   │   └── grade-5/                       # Middle-school sample lessons
│   ├── high-school/
│   │   └── grade-9/                       # High-school exchange/studying abroad lessons
│   ├── independent-learning/
│   │   └── a1/                            # CEFR level lessons
│   ├── blog/                              # Blog articles
│   ├── resources/                         # Dedicated teacher pack lessons
│   └── search-index.json                  # Compiled client-side search database
├── assets/
│   ├── css/
│   │   └── style.css                      # Master CSS Design System (Theming, Layout, Typography)
│   └── js/
│   │   ├── main.js                        # Layout injectors, theme toggle, mobile header
│   │   ├── content-loader.js              # Fetch, parse frontmatter, marked compile
│   │   └── search.js                      # Search panel controls & filter UI
├── scripts/
│   └── generate-search-index.js           # Index compiler Node utility
├── index.html                             # Homepage
├── primary.html                           # Primary School Landing (Grades 1-4)
├── middle-school.html                     # Middle School Landing (Grades 5-8)
├── high-school.html                       # High School Landing (Grades 9-12)
├── independent-learning.html               # Independent CEFR Landing (A1-C1)
├── resources.html                         # Teacher Resource Portal
├── blog.html                              # Blog articles
├── search.html                            # Faceted Search Interface
├── viewer.html                            # Markdown Renderer Layout container
├── package.json                           # Development scripts & local dev server dependencies
└── README.md                              # Technical guide (this file)
```

---

## 🚀 Getting Started

### 1. Prerequisites
You will need [Node.js](https://nodejs.org/) installed to run the indexer and dev server.

### 2. Install Dependencies
Install the developer HTTP server (`lite-server`):
```bash
npm install
```

### 3. Generate Search Index
If you edit or add markdown files inside the `content/` folder, compile the search index database by running:
```bash
npm run index
```

### 4. Run Locally
Start the development server with hot-reload support:
```bash
npm run dev
```
This will launch the app in your default browser at `http://localhost:3000/`.

---

## 🎨 Theme & Accessibility

* **Dark Mode**: Supports automatic system theme preferences as well as a toggle button in the header. The selection is persistent across pages using `localStorage`.
* **Mobile First**: Fluid grids and responsive layouts scale gracefully down to 320px screen widths.
* **Touch Targets**: Buttons, menu items, and checkboxes satisfy WCAG minimum touch sizes (minimum `44px`).

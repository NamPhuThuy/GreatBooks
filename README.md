# GreatBooks Library

Welcome to **GreatBooks Library**, a modern, high-performance web application designed for reading and discovering high-quality books. Built with Angular 21 and styled with Tailwind CSS 4, this project focuses on speed, aesthetics, and a seamless multi-language reading experience.

## 🚀 Features

- **Multi-language Support**: Fully localized in Vietnamese (`vi`) and English (`en`) with URL-based language routing.
- **Dynamic Book Reader**: Renders long-form content using Markdown (via `marked`) with a structured chapter/section hierarchy.
- **Random Discovery**: Smart "Random Book" feature that allows users to discover content by genre, author, or difficulty.
- **Interactive Visuals**: Features dynamic particles and high-quality animations using `tsparticles`.
- **Search & Filtering**: Real-time search across the book index with genre-based filtering.
- **SEO Optimized**: Semantic HTML and optimized metadata for better discoverability.
- **Modern Tech Stack**: Angular 21, Tailwind CSS 4, and deployed on Cloudflare Pages.

## 🛠️ Development Setup

### Local Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the dev server**:
    ```bash
    npm start
    ```
    Navigate to `http://localhost:4200/`. The application will automatically reload on changes.

### Production Build

To build the project for production:
```bash
npm run build
```
Artifacts are stored in the `dist/` directory.

### Deployment

The project is deployed using **Wrangler** to Cloudflare Pages:
```bash
npm run deploy
```

---

## 📚 Content Management

The library's content is managed via static JSON files located in `src/assets/data/`.

### How to Add a New Book

#### 1. Register the Book Metadata
Add a new entry to `src/assets/data/books-index.json`. This file controls the list and search functionality.

```json
{
  "id": "your-book-slug",
  "metadata": {
    "titleVi": "Tiêu đề tiếng Việt",
    "titleEn": "English Title",
    "genres": "Genre Name",
    "difficultyLevel": "Trung bình",
    "tags": ["Tag1", "Tag2"],
    "authors": ["Author Name"],
    "publishedDate": "2024-05-11T00:00:00",
    "length": 30000,
    "pageCount": 120,
    "coverImage": "cover.png"
  },
  "vi": {
    "title": "Tiêu đề tiếng Việt",
    "description": "Mô tả ngắn gọn về sách.",
    "excerpt": "Đoạn trích dẫn..."
  },
  "en": {
    "title": "English Title",
    "description": "Short description of the book.",
    "excerpt": "Excerpt..."
  }
}
```

#### 2. Create the Book Assets
1.  Create a directory at `src/assets/data/books/your-book-slug/`.
2.  Place the cover image (`cover.png`) in this folder.
3.  Create a `book.json` file for the content.

#### 3. Structured Content (`book.json`)
The content follows a hierarchical structure of Chapters, Sections, and SubSections:

```json
{
  "id": "your-book-slug",
  "vi": {
    "chapters": [
      {
        "title": "Chương 1",
        "sections": [
          {
            "title": "Phần 1.1",
            "subSections": [
              {
                "title": "Tiểu mục 1.1.1",
                "content": "Nội dung Markdown ở đây...",
                "image": "diagram.png"
              }
            ]
          }
        ]
      }
    ]
  },
  "en": {
    "chapters": [ ... ]
  }
}
```

### Image Handling
- **Storage**: Place all images (covers, diagrams) inside `src/assets/data/books/{slug}/`.
- **Referencing**: Use only the filename in the JSON files. The app automatically resolves the full path.

---

## 🏗️ Project Structure

- `src/app/core`: Services, utilities (like genre translations), and core models.
- `src/app/features`: Main application modules (Home, Book List, Book Detail, Search).
- `src/assets/i18n`: Translation files for UI strings.
- `src/assets/data`: Data source for books and index.

## 🧪 Testing

Run unit tests with Vitest:
```bash
npm test
```

---

*Powered by Ludo School Team.*


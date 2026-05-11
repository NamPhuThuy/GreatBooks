# Great Articles Library

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Content Management

### How to Add a New Article

To add a new article to the library, follow these three steps:

#### 1. Register the Article Metadata
Add a new entry to `src/assets/data/articles-index.json`. This entry is used for the article list and search.

```json
{
  "id": "your-article-slug",
  "metadata": {
    "titleVi": "Tiêu đề tiếng Việt",
    "titleEn": "English Title",
    "genres": "Genre Name",
    "difficultyLevel": "Cơ bản / Trung bình / Nâng cao",
    "tags": ["tag1", "tag2"],
    "authors": ["Author Name"],
    "publishedDate": "2024-01-01T00:00:00",
    "coverImage": "cover.jpg" 
  },
  "vi": {
    "title": "Tiêu đề tiếng Việt",
    "description": "Mô tả ngắn gọn về sách.",
    "excerpt": "Đoạn trích dẫn..."
  },
  "en": {
    "title": "English Title",
    "description": "Short description of the article.",
    "excerpt": "Excerpt..."
  }
}
```

#### 2. Create the Article Folder
Create a directory at `src/assets/data/articles/your-article-slug/`.

#### 3. Add the Article Content
Create a file named `article.json` inside that folder with the following structure:

```json
{
  "id": "your-article-slug",
  "vi": {
    "chapters": [
      {
        "title": "Chương 1",
        "image": "chapter-1-hero.jpg",
        "sections": [
          {
            "title": "Phần 1",
            "subSections": [
              {
                "title": "Tiểu mục A",
                "content": "Nội dung markdown ở đây...",
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

### Adding Images
1.  **Place Images**: Put all images (covers, diagrams, illustrations) inside the specific article's folder: `src/assets/data/articles/{slug}/`.
2.  **Reference Images**: 
    *   In `articles-index.json`, use the `coverImage` field in metadata.
    *   In `article.json`, use the `image` field in `Chapter`, `Section`, or `SubSection`.
3.  **Automatic Paths**: The application will automatically prepend the correct path (`/assets/data/articles/{slug}/`) to these filenames.

## Development Resources
... (rest of the file)


# Markdown to JSON Conversion Instructions

This document provides instructions for converting a Markdown-based book/article into the structured JSON format used by the Great Books Library project.

---

## 1. Input Markdown Structure
For the best results, ensure the input Markdown follows this hierarchy:

- `# Title` (Book Title)
- `## Chapter Title` (Chapters)
- `### Section Title` (Sections)
- `#### Sub-section Title` (Sub-sections)
- Body text belongs to the most specific heading above it.

---

## 2. Output: Book Content (`book.json`)
Each book must have a `book.json` file located in `src/assets/data/books/{slug}/`.

### Structure:
```json
{
  "id": "slug-name",
  "vi": {
    "chapters": [
      {
        "title": "Chương Title",
        "image": "optional-chapter-image.jpg",
        "sections": [
          {
            "title": "Phần Title",
            "image": "optional-section-image.jpg",
            "subSections": [
              {
                "title": "Tiểu mục Title",
                "content": "Đây là văn bản.\n\n![Mô tả ảnh](minh-hoa.jpg)\n\nTiếp tục văn bản...",
                "image": "optional-thumbnail.jpg"
              }
            ]
          }
        ]
      }
    ]
  },
  "en": {
    "chapters": [ /* Mirror structure for English */ ]
  }
}
```

### Conversion Rules:
1.  **Chapters**: Map `##` headings to the `chapters` array.
2.  **Sections**: Map `###` headings to the `sections` array within a chapter.
3.  **Sub-sections**: Map `####` headings to `subSections` array.
4.  **Content**: All text between headings should be stored in the `content` field of the relevant `subSection`.
5.  **Images**: If an image is present in the Markdown (e.g., `![alt](image.jpg)`), extract the filename and put it in the `image` field of the nearest parent (Chapter, Section, or SubSection). Remove the image syntax from the `content` string.

---

## 3. Adding Images Anywhere
Images can be added **anywhere** within the body text using standard Markdown syntax. You are not limited to one image per section.

### Markdown Syntax:
`![Caption Text](filename.jpg)`

### How it works:
1.  Place the image file in the book's folder: `src/assets/data/books/{slug}/`.
2.  Use the filename directly in your Markdown `content`.
3.  The application will automatically fix the path to `/assets/data/books/{slug}/filename.jpg` during rendering.

---

## 4. Output: Metadata (`books-index.json`)
Every book must be registered in the `src/assets/data/books-index.json` file.

### Entry Structure:
```json
{
  "id": "slug-name",
  "metadata": {
    "titleVi": "Tiêu đề tiếng Việt",
    "titleEn": "English Title",
    "genres": "Genre Name",
    "difficultyLevel": "Cơ bản / Trung bình / Nâng cao",
    "tags": ["Tag1", "Tag2"],
    "authors": ["Author Name"],
    "publishedDate": "YYYY-MM-DDTHH:mm:ss",
    "length": 12345,
    "pageCount": 10,
    "coverImage": "cover.jpg"
  },
  "vi": {
    "title": "Tiêu đề tiếng Việt",
    "description": "A short summary (2-3 sentences).",
    "excerpt": "A short teaser text."
  },
  "en": {
    "title": "English Title",
    "description": "English summary.",
    "excerpt": "English teaser."
  }
}
```

### Conversion Rules:
1.  **ID**: Generate a URL-friendly slug from the title (lowercase, hyphens).
2.  **Length**: Character count of the entire book content.
3.  **Excerpt**: Take the first 150-200 characters of the introduction.
4.  **Description**: Summarize the core message of the book in a few sentences.

---

## 4. Instruction for Chatbots
When asking a chatbot to perform this conversion, use the following prompt:

> "Please convert the following Markdown book into the JSON structure for the Great Books Library project. 
> 1. Create a `book.json` structure following the Chapter -> Section -> SubSection hierarchy. 
> 2. Extract metadata for the `books-index.json` entry, including a summary and tags. 
> 3. Ensure the 'id' is a consistent slug across both files. 
> 4. If images are mentioned, place the filenames in the specific 'image' fields and remove them from the text body."

---

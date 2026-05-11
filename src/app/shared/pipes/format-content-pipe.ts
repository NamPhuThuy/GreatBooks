import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatContent',
  standalone: true
})
export class FormatContentPipe implements PipeTransform {

  transform(content: string | null, slug?: string): string {
    if (!content) return '';

    let result = content;

    // 1. Normalize line breaks
    result = result.replace(/\r\n/g, '\n');

    // 2. Fix image paths if slug is provided
    // Converts ![alt](image.jpg) to ![alt](/assets/data/books/slug/image.jpg)
    if (slug) {
      result = result.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, path) => {
        if (!path.startsWith('http') && !path.startsWith('/') && !path.startsWith('./')) {
          return `![${alt}](/assets/data/books/${slug}/${path})`;
        }
        return match;
      });
    }

    // 3. Convert numbered headings
    // "1. Title" → "### 1. Title"
    result = result.replace(
      /(^|\n)(\d+)\.\s(.+)/g,
      (_, start, num, title) => {
        return `${start}### ${num}. ${title}`;
      }
    );

    // 4. Fix spacing
    result = result.replace(/\n{3,}/g, '\n\n');

    // 5. Add spacing before headings
    result = result.replace(/\n(## )/g, '\n\n$1');

    return result.trim();
  }
}

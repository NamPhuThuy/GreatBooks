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
    if (slug) {
      result = result.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, path) => {
        const [url, query] = path.split('?');
        let finalPath = url;

        if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('./')) {
          finalPath = `/assets/data/books/${slug}/${url}`;
        }

        if (query) {
          const widthMatch = query.match(/(?:w|width)=(\d+)/);
          if (widthMatch) {
            const width = widthMatch[1];
            // If width is specified, return raw HTML img to ensure precise control
            return `<img src="${finalPath}" alt="${alt}" style="width: ${width}vw; min-width: 300px; max-width: 100%; display: block; margin: 2rem auto; border-radius: 1rem;">`;
          }
        }

        return `![${alt}](${finalPath})`;
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

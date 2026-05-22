import { marked } from 'marked';
import { Chapter, BookPage } from '../models/article.model';
import { processInlineCitations } from './reference-processor';

/**
 * Deterministically splits a book's chapter structure into static pages.
 * Since this runs on the text itself, the page breaks are completely static
 * and will not shift when the user resizes or zooms the viewer.
 */
export function paginateBook(
  chapters: Chapter[],
  bookId: string,
  referencesHtml: string | null
): BookPage[] {
  const pages: BookPage[] = [];
  let absolutePageIndex = 0;

  // Format local asset paths correctly
  const formatImagePath = (imgName: string): string => {
    if (!imgName.startsWith('http') && !imgName.startsWith('/') && !imgName.startsWith('./')) {
      return `/assets/data/books/${bookId}/${imgName}`;
    }
    return imgName;
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const mdToHtml = (markdownText: string): string => {
    // Pre-process markdown images to ensure paths are correct
    let processedMd = markdownText.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, path) => {
      const [url, query] = path.split('?');
      const finalPath = formatImagePath(url);
      if (query) {
        const widthMatch = query.match(/(?:w|width)=(\d+)/);
        if (widthMatch) {
          const width = widthMatch[1];
          return `<img src="${finalPath}" alt="${alt}" style="width: ${width}vw; min-width: 250px; max-width: 100%; display: block; margin: 1.5rem auto; border-radius: 0.75rem;">`;
        }
      }
      return `![${alt}](${finalPath})`;
    });

    const html = marked.parse(processedMd, { async: false }) as string;
    return processInlineCitations(html);
  };

  // Helper to ensure a page actually has body paragraphs before we allow flushing
  const hasBodyContent = (paragraphsList: string[]): boolean => {
    return paragraphsList.some(p => {
      const trimmed = p.trim();
      return !trimmed.startsWith('#') && 
             !trimmed.startsWith('<div') && 
             !trimmed.startsWith('Chapter') &&
             !trimmed.startsWith('<section');
    });
  };

  // Loop through each chapter
  for (const chapter of chapters) {
    const chapterTitle = chapter.title || '';
    
    let currentParagraphs: string[] = [];
    let currentWords = 0;
    
    const flushPage = (secTitle?: string) => {
      if (currentParagraphs.length > 0) {
        const pageContentMd = currentParagraphs.join('\n\n');
        const contentHtml = mdToHtml(pageContentMd);
        
        pages.push({
          pageIndex: absolutePageIndex,
          pageNumber: absolutePageIndex + 1,
          chapterTitle,
          sectionTitle: secTitle,
          contentHtml
        });
        absolutePageIndex++;
        currentParagraphs = [];
        currentWords = 0;
      }
    };

    // If a chapter has a cover image, place it on its own beautiful Chapter Title page
    if (chapter.image) {
      const imgPath = formatImagePath(chapter.image);
      const widthStyle = chapter.imageWidth ? `width: ${chapter.imageWidth}vw; min-width: 280px; max-width: 100%;` : '';
      const imgHtml = `
        <div class="chapter-cover-container flex flex-col justify-center items-center h-full text-center py-6">
          <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">${chapterTitle}</h2>
          <div class="my-4 overflow-hidden rounded-xl shadow-lg mx-auto">
            <img src="${imgPath}" style="${widthStyle} border-radius: 0.75rem;" />
          </div>
        </div>
      `;
      
      pages.push({
        pageIndex: absolutePageIndex,
        pageNumber: absolutePageIndex + 1,
        chapterTitle,
        contentHtml: imgHtml
      });
      absolutePageIndex++;
    } else {
      // Start page with a styled Chapter Title
      currentParagraphs.push(`## ${chapterTitle}`);
      currentWords += getWordCount(chapterTitle) + 12; // Title word weight
    }

    for (const section of chapter.sections) {
      const sectionTitle = section.title || '';
      
      if (sectionTitle) {
        // If adding section title to a heavily-packed page, push to a new page
        if (currentWords > 180 && hasBodyContent(currentParagraphs)) {
          flushPage();
        }
        currentParagraphs.push(`### ${sectionTitle}`);
        currentWords += getWordCount(sectionTitle) + 8;
      }

      if (section.image) {
        const imgPath = formatImagePath(section.image);
        const widthStyle = section.imageWidth ? `width: ${section.imageWidth}vw; min-width: 280px; max-width: 100%;` : '';
        const imgMarkdown = `<div class="section-img-container text-center my-4"><img src="${imgPath}" style="${widthStyle} border-radius: 0.75rem;" /></div>`;
        currentParagraphs.push(imgMarkdown);
        currentWords += 96; // Word equivalent weight for images (80% of 120)
      }

      for (const sub of section.subSections) {
        const subTitle = sub.title || '';
        
        if (subTitle) {
          if (currentWords > 210 && hasBodyContent(currentParagraphs)) {
            flushPage(sectionTitle);
          }
          currentParagraphs.push(`#### ${subTitle}`);
          currentWords += getWordCount(subTitle) + 6;
        }

        if (sub.image) {
          const imgPath = formatImagePath(sub.image);
          const widthStyle = sub.imageWidth ? `width: ${sub.imageWidth}vw; min-width: 280px; max-width: 100%;` : '';
          const imgMarkdown = `<div class="subsection-img-container text-center my-4"><img src="${imgPath}" style="${widthStyle} border-radius: 0.5rem;" /></div>`;
          currentParagraphs.push(imgMarkdown);
          currentWords += 80; // 80% of 100
        }

        if (sub.content) {
          const normalizedContent = sub.content.replace(/\r\n/g, '\n');
          const paragraphs = normalizedContent.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
          
          for (const p of paragraphs) {
            const isImage = p.includes('![') || p.includes('<img');
            const pWords = getWordCount(p) + (isImage ? 120 : 0);

            // Target word count of ~300 per page (80% of 380 standard)
            if (currentWords > 0 && currentWords + pWords > 300 && hasBodyContent(currentParagraphs)) {
              flushPage(sectionTitle || undefined);
            }
            
            currentParagraphs.push(p);
            currentWords += pWords;
          }
        }
      }
    }
    
    // Flush remaining content of the chapter
    flushPage();
  }

  // Handle References Section at the end of the book
  if (referencesHtml) {
    const refTitleMatch = referencesHtml.match(/<h3>(.*?)<\/h3>/);
    const refTitle = refTitleMatch ? refTitleMatch[1] : 'References';
    
    const itemRegex = /<div id="ref-[\s\S]*?<\/div>/g;
    const refItems = referencesHtml.match(itemRegex) || [];

    const ITEMS_PER_REF_PAGE = 6;
    for (let i = 0; i < refItems.length; i += ITEMS_PER_REF_PAGE) {
      const chunk = refItems.slice(i, i + ITEMS_PER_REF_PAGE);
      const itemsHtml = chunk.join('\n');
      
      pages.push({
        pageIndex: absolutePageIndex,
        pageNumber: absolutePageIndex + 1,
        chapterTitle: refTitle,
        contentHtml: `
          <section class="references-section mt-4">
            <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">${refTitle} ${refItems.length > ITEMS_PER_REF_PAGE ? `(Trang ${Math.floor(i / ITEMS_PER_REF_PAGE) + 1})` : ''}</h3>
            <div class="space-y-4">
              ${itemsHtml}
            </div>
          </section>
        `
      });
      absolutePageIndex++;
    }
  }

  return pages;
}


export interface SubSection {
  title?: string;
  content: string;
}

export interface Section {
  title?: string;
  subSections: SubSection[];
}

export interface Chapter {
  title?: string;
  sections: Section[];
}

export interface ArticleLocalizedContent {
  title: string;
  description: string;
  excerpt: string;
  tags: string[];
  genres: string[];
  chapters?: Chapter[];
  content?: string; // Kept temporarily for backward compatibility during migration
}

export interface ArticleMetadata {
  titleVi: string;
  titleEn: string;
  genres: string;
  difficultyLevel: string;
  tags: string[];
  authors: string[];
  publishedDate: string;
  length: number;
  pageCount: number;
}

export interface ArticleIndexEntry {
  id: string;
  metadata: ArticleMetadata;
  vi: ArticleLocalizedContent;
  en: ArticleLocalizedContent;
}

export interface ArticlesIndex {
  meta: {
    totalArticles: number;
    generatedAt?: string;
    lastUpdated?: string;
    version?: string;
  };
  articles: ArticleIndexEntry[];
}

export interface ArticleContent {
  id: string;
  vi: { chapters?: Chapter[], content?: string };
  en: { chapters?: Chapter[], content?: string };
}

export interface Article extends ArticleIndexEntry {
  vi: ArticleLocalizedContent & { chapters?: Chapter[], content?: string };
  en: ArticleLocalizedContent & { chapters?: Chapter[], content?: string };
}


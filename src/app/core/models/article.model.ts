export interface SubSection {
  title?: string;
  content: string;
  image?: string;
  imageWidth?: number;
}

export interface Section {
  title?: string;
  image?: string;
  imageWidth?: number;
  subSections: SubSection[];
}

export interface Chapter {
  title?: string;
  image?: string;
  imageWidth?: number;
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
  coverImage?: string;
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


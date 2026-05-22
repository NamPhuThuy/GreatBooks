import { Injectable, signal, computed } from '@angular/core';
import { Bookmark } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly STORAGE_KEY = 'great-books-bookmarks';
  
  // State signal holding all bookmarks
  private _bookmarks = signal<Bookmark[]>([]);

  // Public readonly accessors
  readonly bookmarks = computed(() => this._bookmarks());

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Toggles a bookmark for a specific page of a book.
   */
  toggleBookmark(bookId: string, lang: 'vi' | 'en', pageIndex: number, chapterTitle: string): void {
    const current = this._bookmarks();
    const index = current.findIndex(
      b => b.bookId === bookId && b.lang === lang && b.pageIndex === pageIndex
    );

    let updated: Bookmark[];
    if (index !== -1) {
      // Remove bookmark if it already exists
      updated = current.filter((_, i) => i !== index);
    } else {
      // Add new bookmark
      const newBookmark: Bookmark = {
        bookId,
        lang,
        pageIndex,
        chapterTitle,
        timestamp: Date.now()
      };
      updated = [newBookmark, ...current];
    }

    this._bookmarks.set(updated);
    this.saveToStorage(updated);
  }

  /**
   * Checks if a specific page of a book is bookmarked.
   */
  isBookmarked(bookId: string, lang: 'vi' | 'en', pageIndex: number): boolean {
    return this._bookmarks().some(
      b => b.bookId === bookId && b.lang === lang && b.pageIndex === pageIndex
    );
  }

  /**
   * Returns all bookmarks for a specific book.
   */
  getBookmarksForBook(bookId: string, lang: 'vi' | 'en'): Bookmark[] {
    return this._bookmarks().filter(b => b.bookId === bookId && b.lang === lang);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this._bookmarks.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load bookmarks from localStorage', e);
    }
  }

  private saveToStorage(bookmarks: Bookmark[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e);
    }
  }
}

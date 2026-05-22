import { Component, inject, computed, OnInit, signal, DestroyRef, effect, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { NgClass } from '@angular/common';
import { ArticleService } from '../../core/services/article.service';
import { LanguageService } from '../../core/services/language.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { BookmarkService } from '../../core/services/bookmark.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { RelatedArticlesComponent } from './related-articles.component';
import { Article } from '../../core/models/article.model';
import { translateGenre, translateDifficulty } from '../../core/utils/genre-translations';
import { extractReferences, formatReferencesSection } from '../../core/utils/reference-processor';
import { paginateBook } from '../../core/utils/book-paginator';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    SafeHtmlPipe,
    RelatedArticlesComponent,
  ],
  template: `
    <div class="mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-12 transition-all duration-500">

      @if (loadError()) {
        <!-- Error state -->
        <div class="text-center py-16">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 text-lg">
            {{ langService.isVietnamese() ? 'Không tìm thấy sách.' : 'Book not found.' }}
          </p>
          <a [routerLink]="['/', lang(), 'books']"
             class="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
            ← {{ langService.t('article.backToList') }}
          </a>
        </div>

      } @else if (article()) {
        <!-- Book Toolbar -->
        <header class="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap">
            <a [routerLink]="['/', lang(), 'books']"
               class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1">
              ← {{ langService.t('article.backToList') }}
            </a>
          </div>

          <!-- Bookmarking Dropdown -->
          <div class="relative">
            <button (click)="toggleBookmarkMenu()"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
              🔖 Bookmarks
              <span class="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {{ currentBookBookmarks().length }}
              </span>
            </button>
            
            @if (showBookmarkMenu()) {
              <div class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 p-3 max-h-72 overflow-y-auto">
                <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {{ langService.isVietnamese() ? 'Trang đã lưu' : 'Saved Pages' }}
                </h4>
                @if (currentBookBookmarks().length === 0) {
                  <p class="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
                    {{ langService.isVietnamese() ? 'Chưa lưu trang nào.' : 'No saved pages yet.' }}
                  </p>
                } @else {
                  <div class="space-y-1">
                    @for (bm of currentBookBookmarks(); track bm.timestamp) {
                      <button (click)="jumpToPage(bm.pageIndex)"
                              class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition text-xs flex justify-between items-center text-gray-700 dark:text-gray-300 cursor-pointer">
                        <span class="font-medium truncate max-w-[160px]">{{ bm.chapterTitle }}</span>
                        <span class="text-blue-600 dark:text-blue-400 font-bold shrink-0">Trang {{ bm.pageIndex + 1 }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </header>

        <!-- E-Reader Preferences Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 mb-6">
          <div class="flex items-center gap-3">
            <!-- Font Style Controls -->
            <div class="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <button (click)="prefs.setFontStyle('sans')" 
                      [ngClass]="{'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold': prefs.fontStyle() === 'sans'}"
                      class="px-2.5 py-1 rounded text-xs transition cursor-pointer text-gray-600 dark:text-gray-400 font-sans">Sans</button>
              <button (click)="prefs.setFontStyle('serif')"
                      [ngClass]="{'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold': prefs.fontStyle() === 'serif'}"
                      class="px-2.5 py-1 rounded text-xs transition cursor-pointer text-gray-600 dark:text-gray-400 font-serif">Serif</button>
            </div>
          </div>

          <!-- Title in Center of the bar -->
          <div class="hidden sm:block text-center text-sm font-semibold text-gray-800 dark:text-gray-200 max-w-[450px] leading-snug break-words">
            {{ article()![lang()].title }}
          </div>

          <!-- Right Label -->
          <div class="text-xs text-gray-400 dark:text-gray-500 font-medium select-none">
            {{ langService.isVietnamese() ? 'Trình đọc sách tối giản' : 'Minimalist Reader' }}
          </div>
        </div>

        <!-- REAL BOOK VIEW -->
        <div class="book-container relative w-full flex items-center justify-center py-6 select-none bg-gray-100 dark:bg-gray-950 rounded-3xl"
             [ngClass]="{
               'font-sans':  prefs.fontStyle() === 'sans',
               'font-serif': prefs.fontStyle() === 'serif',
               'font-mono':  prefs.fontStyle() === 'mono'
             }">
          
          <!-- Book Viewport -->
          <div class="book-viewport relative w-full flex items-center justify-center overflow-hidden" 
               #bookViewport
               [style.height.px]="710 * activeScale()">
            
            <!-- Scaleable Pages Wrapper with Tap Zones for Easy Navigation -->
            <div class="relative flex items-center justify-center gap-0"
                 [style.transform]="'scale(' + activeScale() + ')'"
                 [style.transform-origin]="'center center'">
              
              <!-- Page Sheet wrapper container -->
              <div class="book-pages-wrapper relative flex items-center justify-center gap-0 bg-[#e5e1d7] dark:bg-[#1a1918] p-2 md:p-5 rounded-2xl shadow-2xl border border-[#d2cab8] dark:border-[#2f2e2d] transition-all duration-300">
                <!-- SINGLE PAGE LAYOUT -->
                @if (leftPage()) {
                  <div class="book-page-sheet single-page flex flex-col justify-between bg-[#faf8f5] dark:bg-[#232220] text-[#2c2b29] dark:text-[#e4e2df] shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative p-7 select-text">
                    
                    <!-- Left Tap Zone Overlay (Click left 50% to go back) -->
                    <div (click)="prevPage(); $event.stopPropagation()" 
                         [class.pointer-events-none]="currentPageIndex() === 0"
                         class="absolute inset-y-0 left-0 w-1/2 cursor-w-resize z-20 group/tap flex items-center justify-start pl-4 select-none">
                      <div class="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 flex items-center justify-center opacity-0 group-hover/tap:opacity-100 transition duration-250 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </div>

                    <!-- Right Tap Zone Overlay (Click right 50% to go forward) -->
                    <div (click)="nextPage(); $event.stopPropagation()" 
                         [class.pointer-events-none]="isAtEnd()"
                         class="absolute inset-y-0 right-0 w-1/2 cursor-e-resize z-20 group/tap flex items-center justify-end pr-4 select-none">
                      <div class="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 flex items-center justify-center opacity-0 group-hover/tap:opacity-100 transition duration-250 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <!-- TOP HEADER -->
                    <div class="page-header flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200/50 dark:border-gray-800/40 pb-2 mb-4 font-mono select-none">
                      <span>Trang {{ leftPage()!.pageNumber }}</span>
                      <span class="truncate max-w-[140px] font-medium">{{ leftPage()!.chapterTitle }}</span>
                    </div>

                    <!-- CONTENT -->
                    <div class="page-content-wrapper flex-grow overflow-y-auto pr-1">
                      <div class="prose prose-sm dark:prose-invert max-w-none text-[#2c2b29] dark:text-[#e4e2df]" [style.font-size.px]="fontSizePx()" [innerHTML]="leftPage()!.contentHtml | safeHtml"></div>
                    </div>

                    <!-- BOTTOM FOOTER -->
                    <div class="page-footer flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200/50 dark:border-gray-800/40 pt-2 mt-4 font-mono select-none">
                      <span class="font-medium max-w-[65%] leading-tight text-left break-words">{{ article()![lang()].title }}</span>
                      <span>Trang {{ leftPage()!.pageNumber }}</span>
                    </div>

                    <!-- BOOKMARK BUTTON -->
                    <button (click)="toggleLeftBookmark()" 
                            class="absolute top-0 right-6 z-30 transition hover:scale-105 active:scale-95 cursor-pointer"
                            [title]="isLeftBookmarked() ? 'Xóa bookmark' : 'Bookmark trang này'">
                      <svg class="w-7 h-9 transition-all duration-300" viewBox="0 0 24 30" fill="currentColor"
                           [ngClass]="isLeftBookmarked() ? 'text-amber-500' : 'text-gray-300/30 dark:text-gray-700/20 hover:text-amber-400/50'">
                        <path d="M5 2h14a2 2 0 0 1 2 2v24l-8-6-8 6V4a2 2 0 0 1 2-2z"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- Desktop Flanking Zoom Widget (Only visible on Desktop!) -->
              <div class="hidden md:flex flex-col items-center justify-center pl-6 select-none">
                <div class="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-xl select-none w-12">
                  <!-- Zoom In Button -->
                  <button (click)="zoomIn()" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400 transition" title="Zoom In">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>

                  <!-- Zoom percent indicator -->
                  <span class="text-[10px] font-mono font-bold py-1 text-gray-500 dark:text-gray-400 select-none text-center leading-none min-w-[36px]">
                    {{ Math.round(zoomMultiplier() * 100) }}%
                  </span>

                  <!-- Zoom Out Button -->
                  <button (click)="zoomOut()" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400 transition" title="Zoom Out">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Mobile Zoom Toolbar (Only visible on mobile/small screens below viewport!) -->
        <div class="flex md:hidden items-center justify-center mt-4 select-none">
          <div class="flex items-center gap-2 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-lg">
            <!-- Zoom Out -->
            <button (click)="zoomOut()" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-600 dark:text-gray-400 transition" title="Zoom Out">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
              </svg>
            </button>
            <span class="text-xs font-mono font-bold px-2.5 text-gray-600 dark:text-gray-400 select-none min-w-[44px] text-center">
              {{ Math.round(zoomMultiplier() * 100) }}%
            </span>
            <!-- Zoom In -->
            <button (click)="zoomIn()" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-600 dark:text-gray-400 transition" title="Zoom In">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- PROGRESS BAR -->
        <div class="max-w-xl mx-auto mt-6 px-4">
          <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-mono">
            <span>{{ langService.isVietnamese() ? 'Đang đọc' : 'Reading progress' }}: {{ getReadingPercent() }}%</span>
            <span>Trang {{ currentPageIndex() + 1 }} / {{ totalPages() }}</span>
          </div>
          <div class="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600 transition-all duration-300" [style.width]="getReadingPercent() + '%'"></div>
          </div>
        </div>

        <!-- Related Articles -->
        <div class="border-t border-gray-100 dark:border-gray-800 pt-8 mt-12">
          <app-related-articles [articles]="relatedArticles()" />
        </div>

      } @else {
        <!-- Loading State -->
        <div class="text-center py-16">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-500 text-lg">{{ langService.t('common.loading') }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-container {
      perspective: 1500px;
    }
    
    .book-pages-wrapper {
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.3), 
                  inset 0 0 20px rgba(255, 255, 255, 0.05);
    }
    
    .book-page-sheet {
      width: 484px;
      height: 671px;
      display: flex;
      flex-direction: column;
      justify-between: space-between;
      border-radius: 4px;
      box-sizing: border-box;
      transition: all 0.3s ease;
      background-color: #faf8f5;
      color: #2c2b29;
    }

    .dark .book-page-sheet {
      background-color: #232220;
      color: #e4e2df;
    }
    
    .left-page {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    
    .right-page {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    
    .book-spine-crease {
      background: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.02) 0%,
        rgba(0, 0, 0, 0.1) 40%,
        rgba(0, 0, 0, 0.18) 50%,
        rgba(0, 0, 0, 0.1) 60%,
        rgba(0, 0, 0, 0.02) 100%
      );
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
    }

    .page-content-wrapper {
      scrollbar-width: thin;
      scrollbar-color: rgba(59, 130, 246, 0.45) transparent;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 0.5rem;
    }
    
    .dark .page-content-wrapper {
      scrollbar-color: rgba(59, 130, 246, 0.45) transparent;
    }

    .page-content-wrapper::-webkit-scrollbar {
      width: 6px;
    }
    
    .page-content-wrapper::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .page-content-wrapper::-webkit-scrollbar-thumb {
      background-color: rgba(59, 130, 246, 0.35);
      border-radius: 20px;
    }
    
    .page-content-wrapper::-webkit-scrollbar-thumb:hover {
      background-color: rgba(59, 130, 246, 0.55);
    }

    /* Locked size of elements to never break the page width */
    ::ng-deep .page-content-wrapper * {
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
    }

    /* Target direct HTML classes */
    ::ng-deep .page-content-wrapper h2 {
      font-size: 1.5em !important;
      font-weight: 700 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.75rem !important;
      line-height: 1.25 !important;
    }

    ::ng-deep .page-content-wrapper h3 {
      font-size: 1.3em !important;
      font-weight: 600 !important;
      margin-top: 0.75rem !important;
      margin-bottom: 0.5rem !important;
    }

    ::ng-deep .page-content-wrapper h4 {
      font-size: 1.15em !important;
      font-weight: 600 !important;
      margin-top: 0.75rem !important;
      margin-bottom: 0.5rem !important;
    }

    ::ng-deep .page-content-wrapper p {
      font-size: 0.95em !important;
      line-height: 1.6 !important;
      margin-bottom: 0.75rem !important;
    }

    ::ng-deep .page-content-wrapper img {
      max-height: 280px !important;
      max-width: 100% !important;
      object-fit: contain !important;
      width: auto !important;
      display: block;
      margin: 1rem auto;
      border-radius: 0.5rem;
      box-sizing: border-box !important;
    }
  `]
})
export class ArticleDetailComponent implements OnInit, AfterViewInit {
  private articleService = inject(ArticleService);
  langService = inject(LanguageService);
  bookmarkService = inject(BookmarkService);
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private destroyRef = inject(DestroyRef);

  public prefs = inject(UserPreferencesService);
  readonly Math = Math;

  @ViewChild('bookViewport', { static: false }) bookViewport?: ElementRef;

  lang = this.langService.currentLang;

  article = signal<Article | undefined>(undefined);
  loadError = signal(false);

  // Pagination-specific UI signals
  currentPageIndex = signal<number>(0);
  isDoublePage = signal<boolean>(false);
  zoomMultiplier = signal<number>(1.0);
  calculatedScale = signal<number>(1.0);
  showBookmarkMenu = signal<boolean>(false);

  activeScale = computed(() => this.calculatedScale());
  fontSizePx = computed(() => 16 * this.zoomMultiplier());

  // Parse body and references from current-language content
  private parsedArticle = computed(() => {
    const a = this.article();
    if (!a) return null;
    const lang = this.lang();
    
    let chapters = a[lang]?.chapters;
    if (!chapters && a[lang]?.content) {
      chapters = [{
        title: lang === 'vi' ? 'Chương 1' : 'Chapter 1',
        sections: [{
          title: lang === 'vi' ? 'Phần 1' : 'Section 1',
          subSections: [{ content: a[lang]!.content! }]
        }]
      }];
    }
    
    if (!chapters) return null;

    let allReferences: any[] = [];
    const processedChapters = JSON.parse(JSON.stringify(chapters));
    
    for (const chapter of processedChapters) {
      for (const section of chapter.sections) {
        for (const sub of section.subSections) {
          if (sub.content) {
            const { body, references } = extractReferences(sub.content);
            sub.content = body;
            allReferences = [...allReferences, ...references];
          }
        }
      }
    }

    if (allReferences.length === 0) {
      const otherLang = lang === 'vi' ? 'en' : 'vi';
      let otherChapters = a[otherLang]?.chapters;
      
      if (!otherChapters && a[otherLang]?.content) {
        otherChapters = [{ sections: [{ subSections: [{ content: a[otherLang]!.content! }] }] }];
      }
      
      if (otherChapters) {
        for (const chapter of otherChapters) {
          for (const section of chapter.sections) {
            for (const sub of section.subSections) {
              if (sub.content) {
                const { references } = extractReferences(sub.content);
                allReferences = [...allReferences, ...references];
              }
            }
          }
        }
      }
    }

    const title = lang === 'vi' ? 'Tham khảo' : 'References';
    return {
      chapters: processedChapters,
      referencesHtml: allReferences.length > 0 ? formatReferencesSection(allReferences, title) : null,
    };
  });

  // Pages derived from parsed article
  pages = computed(() => {
    const parsed = this.parsedArticle();
    const a = this.article();
    if (!parsed || !a) return [];
    return paginateBook(parsed.chapters, a.id, parsed.referencesHtml);
  });

  totalPages = computed(() => this.pages().length);

  leftPage = computed(() => {
    const p = this.pages();
    const idx = this.currentPageIndex();
    if (p.length === 0) return null;
    
    if (!this.isDoublePage()) {
      return p[idx] || null;
    }
    
    const leftIdx = idx - (idx % 2);
    return p[leftIdx] || null;
  });

  rightPage = computed(() => {
    const p = this.pages();
    const idx = this.currentPageIndex();
    if (p.length === 0 || !this.isDoublePage()) return null;
    
    const leftIdx = idx - (idx % 2);
    const rightIdx = leftIdx + 1;
    return p[rightIdx] || null;
  });

  // Bookmark status computed values
  isLeftBookmarked = computed(() => {
    const lp = this.leftPage();
    const a = this.article();
    if (!lp || !a) return false;
    return this.bookmarkService.isBookmarked(a.id, this.lang(), lp.pageIndex);
  });

  isRightBookmarked = computed(() => {
    const rp = this.rightPage();
    const a = this.article();
    if (!rp || !a) return false;
    return this.bookmarkService.isBookmarked(a.id, this.lang(), rp.pageIndex);
  });

  currentBookBookmarks = computed(() => {
    const a = this.article();
    if (!a) return [];
    return this.bookmarkService.getBookmarksForBook(a.id, this.lang());
  });

  relatedArticles = computed(() => {
    const a = this.article();
    return a ? this.articleService.getRelatedArticles(a.id, 6)() : [];
  });

  constructor() {
    // Reset scrollbar slider position to top when turning pages
    effect(() => {
      const idx = this.currentPageIndex();
      setTimeout(() => {
        const wrappers = document.querySelectorAll('.page-content-wrapper');
        wrappers.forEach(w => w.scrollTop = 0);
      }, 0);
    });

    // Synchronize document page titles
    effect(() => {
      const a = this.article();
      if (a) {
        const lang = this.lang();
        this.titleService.setTitle(`${a[lang].title} | Great Books Library`);
        this.metaService.updateTag({ name: 'description', content: a[lang].description });
        this.metaService.updateTag({ property: 'og:title', content: a[lang].title });
        this.metaService.updateTag({ property: 'og:description', content: a[lang].description });
      }
    });

    // Auto-load bookmarks when book changes
    effect(() => {
      const a = this.article();
      const lang = this.lang();
      const bookPages = this.pages();
      if (a && bookPages.length > 0) {
        const saved = this.bookmarkService.getBookmarksForBook(a.id, lang);
        if (saved.length > 0) {
          const mostRecent = [...saved].sort((x, y) => y.timestamp - x.timestamp)[0];
          if (mostRecent.pageIndex >= 0 && mostRecent.pageIndex < bookPages.length) {
            this.currentPageIndex.set(mostRecent.pageIndex);
          } else {
            this.currentPageIndex.set(0);
          }
        } else {
          this.currentPageIndex.set(0);
        }
        // Run initial scaling
        setTimeout(() => this.calculateScale(), 50);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const lang = params.get('lang');
        if (lang) this.langService.setLanguageFromRoute(lang);

        const slug = params.get('slug');
        if (slug) {
          this.article.set(undefined);
          this.loadError.set(false);
          this.currentPageIndex.set(0);

          this.articleService.getArticle$(slug)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (art) => {
                if (art) {
                  this.article.set(art);
                } else {
                  this.loadError.set(true);
                }
              },
              error: () => this.loadError.set(true)
            });
        }
      });

    // Permanently set page layout mode to single page
    this.isDoublePage.set(false);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.calculateScale(), 100);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDoublePage.set(false);
    this.calculateScale();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Only capture page turn events if the user is not actively typing in an input
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault();
      this.nextPage();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevPage();
    }
  }

  calculateScale(): void {
    if (!this.bookViewport) return;
    const width = this.bookViewport.nativeElement.clientWidth;
    const height = 710; 

    const targetPageWidth = 484; 
    const targetPageHeight = 671; 
    
    // Desktop has a flanking zoom column on the right side (72px allowance), 
    // while mobile layout has no flanking controls at all (0px allowance).
    const flankingAllowance = width < 768 ? 0 : 72;
    const targetBookWidth = targetPageWidth + flankingAllowance;
    
    // Scale down comfortably so both page card and all controls fit beautifully
    const scaleX = (width * 0.94) / targetBookWidth;
    const scaleY = (height * 0.94) / targetPageHeight;
    
    const finalScale = Math.min(scaleX, scaleY);
    this.calculatedScale.set(Math.max(0.35, Math.min(1.5, finalScale)));
  }

  nextPage(): void {
    const pages = this.pages();
    const total = pages.length;
    const current = this.currentPageIndex();
    
    if (this.isDoublePage()) {
      const leftIdx = current - (current % 2);
      if (leftIdx + 2 < total) {
        this.currentPageIndex.set(leftIdx + 2);
      }
    } else {
      if (current + 1 < total) {
        this.currentPageIndex.set(current + 1);
      }
    }
  }

  prevPage(): void {
    const current = this.currentPageIndex();
    
    if (this.isDoublePage()) {
      const leftIdx = current - (current % 2);
      if (leftIdx - 2 >= 0) {
        this.currentPageIndex.set(leftIdx - 2);
      }
    } else {
      if (current - 1 >= 0) {
        this.currentPageIndex.set(current - 1);
      }
    }
  }

  isAtEnd(): boolean {
    const pages = this.pages();
    const total = pages.length;
    const current = this.currentPageIndex();
    
    if (this.isDoublePage()) {
      const leftIdx = current - (current % 2);
      return leftIdx + 2 >= total;
    } else {
      return current + 1 >= total;
    }
  }

  toggleDoublePageMode(): void {
    this.isDoublePage.update(d => !d);
    setTimeout(() => this.calculateScale(), 50);
  }

  zoomIn(): void {
    this.zoomMultiplier.update(z => Math.min(2.0, z + 0.1));
  }

  zoomOut(): void {
    this.zoomMultiplier.update(z => Math.max(0.5, z - 0.1));
  }

  getReadingPercent(): number {
    const total = this.totalPages();
    if (total <= 1) return 100;
    
    let currentRead = this.currentPageIndex() + 1;
    if (this.isDoublePage() && this.rightPage()) {
      currentRead = this.rightPage()!.pageNumber;
    }
    
    return Math.round((currentRead / total) * 100);
  }

  // Bookmark actions
  toggleBookmarkMenu(): void {
    this.showBookmarkMenu.update(s => !s);
  }

  jumpToPage(index: number): void {
    this.currentPageIndex.set(index);
    this.showBookmarkMenu.set(false);
  }

  toggleLeftBookmark(): void {
    const lp = this.leftPage();
    const a = this.article();
    if (lp && a) {
      this.bookmarkService.toggleBookmark(a.id, this.lang(), lp.pageIndex, lp.chapterTitle);
    }
  }

  toggleRightBookmark(): void {
    const rp = this.rightPage();
    const a = this.article();
    if (rp && a) {
      this.bookmarkService.toggleBookmark(a.id, this.lang(), rp.pageIndex, rp.chapterTitle);
    }
  }

  readonly translateGenre = translateGenre;
  readonly translateDifficulty = translateDifficulty;

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.lang() === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

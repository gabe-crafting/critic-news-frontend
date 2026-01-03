import { Component, EventEmitter, Output, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subscription } from 'rxjs';
import { PostsService } from '../../../core/services/posts.service';
import { SearchService } from '../../../core/services/search.service';

export interface SearchFilters {
  tags: string[];
  title: string;
  tagMode: 'union' | 'intersection'; // 'union' = OR (at least one), 'intersection' = AND (all)
}

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent implements OnInit, OnDestroy {
  @Output() searchChange = new EventEmitter<SearchFilters>();
  
  isExpanded = false;
  titleSearch = '';
  tagSearch = '';
  selectedTags = signal<string[]>([]);
  availableTags: string[] = [];
  tagMode: 'union' | 'intersection' = 'union'; // Default to union (OR logic)
  private searchSubscription?: Subscription;
  private tagModeSubscription?: Subscription;
  private isUpdatingFromService = false;

  constructor(
    private postsService: PostsService,
    private searchService: SearchService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTags();

    // Subscribe to search triggers from other components (e.g., tags sidebar)
    this.searchSubscription = this.searchService.searchTrigger$.subscribe(filters => {
      // Update the search panel state
      this.isUpdatingFromService = true;
      this.titleSearch = filters.title;
      this.selectedTags.set([...filters.tags]);
      this.tagMode = filters.tagMode || 'union';

      // Emit the search change to parent components
      this.searchChange.emit(filters);
      this.isUpdatingFromService = false;
    });

    // Subscribe to tag mode changes to stay in sync with other components
    this.tagModeSubscription = this.searchService.tagMode$.subscribe(tagMode => {
      if (!this.isUpdatingFromService) {
        this.tagMode = tagMode;
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.tagModeSubscription?.unsubscribe();
  }

  async loadTags(): Promise<void> {
    try {
      this.availableTags = await this.postsService.getAllTags();
    } catch (error) {
      console.error('Failed to load tags:', error);
      this.availableTags = [];
    }
  }

  onTitleChange(): void {
    // No longer auto-search on input change
  }

  onTagInputEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && this.tagSearch.trim()) {
      this.addTag(this.tagSearch.trim());
      this.tagSearch = '';
      keyboardEvent.preventDefault();
    }
  }

  getFilteredAvailableTags(): string[] {
    return this.availableTags.filter(tag =>
      tag.toLowerCase().includes(this.tagSearch.toLowerCase()) &&
      !this.selectedTags().includes(tag)
    );
  }

  addTag(tag: string): void {
    if (tag && !this.selectedTags().includes(tag)) {
      this.selectedTags.set([...this.selectedTags(), tag]);
      // No longer auto-search when adding tag
    }
  }

  removeTag(tag: string): void {
    this.selectedTags.set(this.selectedTags().filter(t => t !== tag));
    // No longer auto-search when removing tag
  }

  onSearch(): void {
    this.emitSearch();
  }

  onExpansionChange(expanded: boolean): void {
    this.isExpanded = expanded;
    if (!expanded) {
      // Clear search when collapsed (optional behavior)
      // this.clearSearch();
    }
  }

  clearSearch(): void {
    this.titleSearch = '';
    this.tagSearch = '';
    this.selectedTags.set([]);
    this.tagMode = 'union'; // Reset to default
    // Emit empty search to clear results (will update service via emitSearch)
    this.emitSearch();
  }

  onTagModeToggle(event: MatSlideToggleChange): void {
    // Update tag mode based on toggle state
    this.tagMode = event.checked ? 'intersection' : 'union';
    // Update search service to sync with other components
    this.searchService.triggerSearch({
      title: this.titleSearch.trim(),
      tags: [...this.selectedTags()],
      tagMode: this.tagMode
    });
    // Emit search when tag mode changes to update results immediately
    this.emitSearch();
  }

  private emitSearch(): void {
    const filters = {
      title: this.titleSearch.trim(),
      tags: [...this.selectedTags()],
      tagMode: this.tagMode
    };
    this.searchChange.emit(filters);
    // Always update the search service to keep tags sidebar in sync
    this.searchService.triggerSearch(filters);
  }
}


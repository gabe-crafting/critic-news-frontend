import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { SearchFilters } from '../../shared/components/search-panel/search-panel.component';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTrigger = new Subject<SearchFilters>();
  private selectedTagsSubject = new BehaviorSubject<string[]>([]);
  private tagModeSubject = new BehaviorSubject<'union' | 'intersection'>('union');

  // Observable that components can subscribe to
  searchTrigger$ = this.searchTrigger.asObservable();
  selectedTags$ = this.selectedTagsSubject.asObservable();
  tagMode$ = this.tagModeSubject.asObservable();

  /**
   * Trigger a search with the given filters
   */
  triggerSearch(filters: SearchFilters): void {
    this.searchTrigger.next(filters);
    this.selectedTagsSubject.next([...filters.tags]);
    this.tagModeSubject.next(filters.tagMode || 'union');
  }

  /**
   * Get current tag mode
   */
  getTagMode(): 'union' | 'intersection' {
    return this.tagModeSubject.value;
  }

  /**
   * Trigger a search for a specific tag (toggles if already selected)
   */
  searchByTag(tag: string, tagMode: 'union' | 'intersection' = 'union'): void {
    const normalizedTag = tag.toLowerCase();
    const currentTags = this.selectedTagsSubject.value;
    // Check if tag is already selected (case-insensitive)
    const isAlreadySelected = currentTags.some(t => t.toLowerCase() === normalizedTag);

    // Toggle: remove if already selected, add if not selected
    const newTags = isAlreadySelected
      ? currentTags.filter(t => t.toLowerCase() !== normalizedTag)
      : [...currentTags, normalizedTag];

    this.triggerSearch({
      title: '',
      tags: newTags,
      tagMode: tagMode
    });
  }

  /**
   * Get current selected tags
   */
  getSelectedTags(): string[] {
    return this.selectedTagsSubject.value;
  }
}


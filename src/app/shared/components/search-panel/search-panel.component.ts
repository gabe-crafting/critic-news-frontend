import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PostsService } from '../../../core/services/posts.service';

export interface SearchFilters {
  tags: string[];
  title: string;
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
    MatButtonModule
  ],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent implements OnInit {
  @Output() searchChange = new EventEmitter<SearchFilters>();
  
  isExpanded = false;
  titleSearch = '';
  tagSearch = '';
  selectedTags: string[] = [];
  availableTags: string[] = [];

  constructor(private postsService: PostsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTags();
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
      !this.selectedTags.includes(tag)
    );
  }

  addTag(tag: string): void {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      // No longer auto-search when adding tag
    }
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
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
    this.selectedTags = [];
    // Emit empty search to clear results
    this.emitSearch();
  }

  private emitSearch(): void {
    this.searchChange.emit({
      title: this.titleSearch.trim(),
      tags: [...this.selectedTags]
    });
  }
}


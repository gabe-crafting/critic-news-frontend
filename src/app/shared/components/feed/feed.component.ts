import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchPanelComponent, SearchFilters } from '../search-panel/search-panel.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, SearchPanelComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent {
  @Input() showSearch = true;
  @Input() showTodo = true;
  @Output() searchChange = new EventEmitter<SearchFilters>();

  onSearchChange(filters: SearchFilters): void {
    this.searchChange.emit(filters);
  }
}


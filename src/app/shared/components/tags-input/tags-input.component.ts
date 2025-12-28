import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tags-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './tags-input.component.html',
  styleUrl: './tags-input.component.css'
})
export class TagsInputComponent {
  @Input() tags: string[] = [];
  @Input() placeholder = 'Add a tag and press Enter';
  @Output() tagsChange = new EventEmitter<string[]>();

  tagInput = '';

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  /**
   * Sanitizes a tag: converts to lowercase, removes spaces and special characters
   * Only allows letters (a-z)
   */
  private sanitizeTag(tag: string): string {
    return tag
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, ''); // Remove all non-letter characters
  }

  addTag(): void {
    const sanitizedTag = this.sanitizeTag(this.tagInput);
    if (sanitizedTag && sanitizedTag.length > 0 && !this.tags.includes(sanitizedTag)) {
      const newTags = [...this.tags, sanitizedTag];
      this.tagsChange.emit(newTags);
      this.tagInput = '';
    } else if (sanitizedTag.length === 0) {
      // Clear input if tag was invalid
      this.tagInput = '';
    }
  }

  removeTag(tagToRemove: string): void {
    const newTags = this.tags.filter(tag => tag !== tagToRemove);
    this.tagsChange.emit(newTags);
  }
}


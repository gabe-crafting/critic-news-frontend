import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-tags-sidebar',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatCardModule],
  templateUrl: './tags-sidebar.component.html',
  styleUrl: './tags-sidebar.component.css'
})
export class TagsSidebarComponent {
  // Mock usually viewed tags
  usuallyViewedTags = [
    'Technology',
    'Politics',
    'Science',
    'Health',
    'Business',
    'Entertainment',
    'Sports',
    'Climate',
    'Education',
    'Culture'
  ];
}


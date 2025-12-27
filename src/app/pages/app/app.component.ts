import { Component } from '@angular/core';
import { AppTitleComponent } from '../../shared/components/app-title/app-title.component';
import { MenuComponent } from '../../shared/components/menu/menu.component';
import { FeedComponent } from '../../shared/components/feed/feed.component';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [AppTitleComponent, MenuComponent, FeedComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent {}



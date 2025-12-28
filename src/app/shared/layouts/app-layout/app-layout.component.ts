import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { AppTitleComponent } from '../../components/app-title/app-title.component';
import { MenuComponent } from '../../components/menu/menu.component';
import { TagsSidebarComponent } from '../../components/tags-sidebar/tags-sidebar.component';
import { UserInfoComponent } from '../../components/user-info/user-info.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatCardModule,
    AppTitleComponent,
    MenuComponent,
    TagsSidebarComponent,
    UserInfoComponent
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent {}


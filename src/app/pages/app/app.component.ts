import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppPageComponent {}


import { TuiRoot } from '@taiga-ui/core';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './core/layout/navbar/navbar';
import { Footer } from './core/layout/footer/footer';
import { AccessibilityPanel } from './core/layout/accessibility-panel/accessibility-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, Navbar, Footer, AccessibilityPanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}

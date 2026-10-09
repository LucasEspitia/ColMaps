import { Component } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, TuiButton],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent {}

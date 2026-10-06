import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.sass',
})
export class Shell {}

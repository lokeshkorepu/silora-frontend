import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [RouterOutlet, HeaderComponent],
})
export class AppComponent { 

  
}

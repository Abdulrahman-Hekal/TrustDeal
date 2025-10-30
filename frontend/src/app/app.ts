import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< Updated upstream
import { HeaderComponent } from './components/header.component/header.component';
=======
import { HeaderComponent } from "./components/header/header.component/header.component";
import { Home } from "./pages/home/home";
>>>>>>> Stashed changes

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, Home],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

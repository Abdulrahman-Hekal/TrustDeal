import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component/header.component";
import { Home } from "./pages/home/home";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, Home],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

import { Component } from '@angular/core';
import { FormProjects } from "../../components/form-projects/form-projects"
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  imports: [FormProjects, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormProjects } from './form-projects';

describe('FormProjects', () => {
  let component: FormProjects;
  let fixture: ComponentFixture<FormProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormProjects]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

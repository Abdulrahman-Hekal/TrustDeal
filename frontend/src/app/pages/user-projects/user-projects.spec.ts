import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProjects } from './user-projects';

describe('UserProjects', () => {
  let component: UserProjects;
  let fixture: ComponentFixture<UserProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProjects]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

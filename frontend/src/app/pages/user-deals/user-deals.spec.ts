import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDeals } from './user-deals';

describe('UserDeals', () => {
  let component: UserDeals;
  let fixture: ComponentFixture<UserDeals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDeals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserDeals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

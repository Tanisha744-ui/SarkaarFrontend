import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingpageOnline } from './landingpage-online';

describe('LandingpageOnline', () => {
  let component: LandingpageOnline;
  let fixture: ComponentFixture<LandingpageOnline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingpageOnline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingpageOnline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

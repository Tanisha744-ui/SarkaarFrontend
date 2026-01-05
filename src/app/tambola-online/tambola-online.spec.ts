import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TambolaOnline } from './tambola-online';

describe('TambolaOnline', () => {
  let component: TambolaOnline;
  let fixture: ComponentFixture<TambolaOnline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TambolaOnline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TambolaOnline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

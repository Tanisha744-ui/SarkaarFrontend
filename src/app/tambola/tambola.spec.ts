import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tambola } from './tambola';

describe('Tambola', () => {
  let component: Tambola;
  let fixture: ComponentFixture<Tambola>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tambola]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tambola);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

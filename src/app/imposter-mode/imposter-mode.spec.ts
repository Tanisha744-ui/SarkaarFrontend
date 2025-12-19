import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImposterMode } from './imposter-mode';

describe('ImposterMode', () => {
  let component: ImposterMode;
  let fixture: ComponentFixture<ImposterMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImposterMode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImposterMode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

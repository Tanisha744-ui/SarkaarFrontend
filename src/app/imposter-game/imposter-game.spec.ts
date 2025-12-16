import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImposterGame } from './imposter-game';

describe('ImposterGame', () => {
  let component: ImposterGame;
  let fixture: ComponentFixture<ImposterGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImposterGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImposterGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

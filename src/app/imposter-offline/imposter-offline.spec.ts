import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImposterOffline } from './imposter-offline';

describe('ImposterOffline', () => {
  let component: ImposterOffline;
  let fixture: ComponentFixture<ImposterOffline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImposterOffline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImposterOffline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

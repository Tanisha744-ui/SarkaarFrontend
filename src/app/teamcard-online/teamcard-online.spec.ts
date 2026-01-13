import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamcardOnline } from './teamcard-online';

describe('TeamcardOnline', () => {
  let component: TeamcardOnline;
  let fixture: ComponentFixture<TeamcardOnline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamcardOnline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamcardOnline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

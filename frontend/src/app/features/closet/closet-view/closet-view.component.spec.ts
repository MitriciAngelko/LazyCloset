import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosetViewComponent } from './closet-view.component';

describe('ClosetViewComponent', () => {
  let component: ClosetViewComponent;
  let fixture: ComponentFixture<ClosetViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClosetViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosetViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

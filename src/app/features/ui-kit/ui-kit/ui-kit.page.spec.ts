import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiKitPage } from './ui-kit.page';

describe('UiKitPage', () => {
  let component: UiKitPage;
  let fixture: ComponentFixture<UiKitPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UiKitPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

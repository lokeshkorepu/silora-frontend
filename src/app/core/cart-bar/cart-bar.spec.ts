import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartBar } from './cart-bar';

describe('CartBar', () => {
  let component: CartBar;
  let fixture: ComponentFixture<CartBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

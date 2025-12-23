import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesTable } from './sales-table';

describe('SalesTable', () => {
  let component: SalesTable;
  let fixture: ComponentFixture<SalesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GraphsPage } from './graphs.page';

describe('GraphsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphsPage],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders a placeholder', () => {
    const fixture = TestBed.createComponent(GraphsPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.graphs-placeholder')?.textContent).toContain(
      'Charts land here',
    );
  });
});

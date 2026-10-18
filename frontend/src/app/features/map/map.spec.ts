import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MapCanvas } from './components/map-canvas/map-canvas';
import { MapComponent } from './map';

@Component({ selector: 'app-map-canvas', template: '' })
class MapCanvasStub {}

describe('MapComponent', () => {
  it('should compose the page header and map canvas', () => {
    TestBed.configureTestingModule({ imports: [MapComponent] });
    TestBed.overrideComponent(MapComponent, {
      remove: { imports: [MapCanvas] },
      add: { imports: [MapCanvasStub] },
    });

    const fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Explore Colombia');
    expect(fixture.debugElement.queryAll(By.directive(MapCanvasStub))).toHaveLength(1);
  });
});

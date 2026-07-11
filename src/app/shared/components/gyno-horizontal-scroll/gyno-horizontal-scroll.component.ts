import { Component } from '@angular/core';

@Component({
  selector: 'gyno-horizontal-scroll',
  template: `
    <div
      class="flex gap-3 overflow-x-auto pb-2 -mb-2 scroll-smooth snap-x snap-mandatory"
      style="scrollbar-width: none; -ms-overflow-style: none;"
    >
      <ng-content />
    </div>
  `,
  standalone: true,
})
export class GynoHorizontalScrollComponent {}

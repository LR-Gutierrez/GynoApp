import { Component, input, output, computed } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-pagination',
  templateUrl: './gyno-pagination.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoPaginationComponent {
  readonly currentPage = input(1);
  readonly totalItems = input(0);
  readonly pageSize = input(10);

  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  readonly endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  readonly canPrev = computed(() => this.currentPage() > 1);
  readonly canNext = computed(() => this.currentPage() < this.totalPages());

  prev() {
    if (this.canPrev()) this.pageChange.emit(this.currentPage() - 1);
  }

  next() {
    if (this.canNext()) this.pageChange.emit(this.currentPage() + 1);
  }
}

import { Component, inject, signal } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GynoSearchBarComponent } from 'src/app/shared/components/gyno-search-bar/gyno-search-bar.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoHorizontalScrollComponent } from 'src/app/shared/components/gyno-horizontal-scroll/gyno-horizontal-scroll.component';
import { GynoRecentCardComponent, RecentPatient } from 'src/app/shared/components/gyno-recent-card/gyno-recent-card.component';
import { GynoPatientTableComponent, TablePatient } from 'src/app/shared/components/gyno-patient-table/gyno-patient-table.component';
import { GynoFabComponent } from 'src/app/shared/components/gyno-fab/gyno-fab.component';
import { GynoBottomNavComponent } from 'src/app/shared/components/gyno-bottom-nav/gyno-bottom-nav.component';
import { GynoFilterPopoverComponent } from 'src/app/shared/components/gyno-filter-popover/gyno-filter-popover.component';
import { GynoActionPopoverComponent } from 'src/app/shared/components/gyno-action-popover/gyno-action-popover.component';
import { GynoTopbarComponent } from 'src/app/shared/components/gyno-topbar/gyno-topbar.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    GynoSearchBarComponent,
    GynoSectionHeaderComponent,
    GynoHorizontalScrollComponent,
    GynoRecentCardComponent,
    GynoPatientTableComponent,
    GynoFabComponent,
    GynoBottomNavComponent,
    GynoFilterPopoverComponent,
    GynoActionPopoverComponent,
    GynoTopbarComponent,
  ],
})
export class HomePage {
  private popoverController = inject(PopoverController);

  private originalPatients: TablePatient[] = [
    { id: '1', name: 'María García', age: 34, phone: '+58 412-1234567', address: 'Av. Principal, Caracas', createdAt: '2026-01-01', updatedAt: '2026-06-15', ultimaConsulta: '15 Jun 2026', status: 'Control Rutina', statusVariant: 'success' },
    { id: '2', name: 'Beatriz Gómez', age: 31, phone: '+58 414-1112233', createdAt: '2026-01-05', updatedAt: '2026-06-12', ultimaConsulta: '12 Jun 2026', status: 'Seguimiento', statusVariant: 'warning' },
    { id: '3', name: 'Claudia Paredes', age: 25, phone: '+58 414-2223344', createdAt: '2026-02-10', updatedAt: '2026-06-10', ultimaConsulta: '10 Jun 2026', status: 'Prenatal', statusVariant: 'info' },
    { id: '4', name: 'Diana Rivas', age: 39, phone: '+58 414-3334455', createdAt: '2026-02-15', updatedAt: '2026-06-08', ultimaConsulta: '08 Jun 2026', status: 'Control Rutina', statusVariant: 'success' },
    { id: '5', name: 'Fernanda Pardo', age: 45, phone: '+58 414-4445566', createdAt: '2026-03-01', updatedAt: '2026-06-05', ultimaConsulta: '05 Jun 2026', status: 'Control Rutina', statusVariant: 'success' },
    { id: '6', name: 'Sofía Martínez', age: 28, phone: '+58 414-5556677', createdAt: '2026-03-10', updatedAt: '2026-06-03', ultimaConsulta: '03 Jun 2026', status: 'Seguimiento', statusVariant: 'warning' },
  ];

  readonly recentPatients: RecentPatient[] = [
    { id: '1', name: 'María García', age: 34, consultationId: 'CON-024', lastVisitDate: '15 Jun 2026', lastVisitTime: '10:30 am' },
    { id: '2', name: 'Beatriz Gómez', age: 31, consultationId: 'CON-023', lastVisitDate: '12 Jun 2026', lastVisitTime: '4:15 pm' },
    { id: '3', name: 'Claudia Paredes', age: 25, consultationId: 'CON-022', lastVisitDate: '10 Jun 2026', lastVisitTime: '9:00 am' },
    { id: '4', name: 'Diana Rivas', age: 39, consultationId: 'CON-021', lastVisitDate: '08 Jun 2026', lastVisitTime: '11:45 am' },
    { id: '5', name: 'Fernanda Pardo', age: 45, consultationId: 'CON-020', lastVisitDate: '05 Jun 2026', lastVisitTime: '3:00 pm' },
    { id: '6', name: 'Sofía Martínez', age: 28, consultationId: 'CON-019', lastVisitDate: '03 Jun 2026', lastVisitTime: '8:30 am' },
  ];

  patients = signal<TablePatient[]>([...this.originalPatients]);

  currentPage = 1;
  pageSize = 5;
  totalCount = 6;

  sortField = '';
  private sortAsc = true;

  onSearch(value: string) {
    console.log('Search:', value);
  }

  onRecentCardClicked(patient: RecentPatient) {
    console.log('Recent card clicked:', patient);
  }

  onViewAll() {
    console.log('View all recent patients');
  }

  async onFilter(event: MouseEvent) {
    const popover = await this.popoverController.create({
      component: GynoFilterPopoverComponent,
      componentProps: { activeFilter: this.sortField },
      event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
    const { data } = await popover.onWillDismiss();
    if (!data?.filter) return;
    this.applyFilter(data.filter);
  }

  private applyFilter(filter: string) {
    if (filter === 'clear') {
      this.sortField = '';
      this.patients.set([...this.originalPatients]);
      return;
    }
    if (this.sortField === filter) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = filter;
      this.sortAsc = true;
    }
    const sorted = [...this.originalPatients].sort((a, b) => {
      let cmp = 0;
      if (filter === 'date') {
        cmp = this.parseDate(b.ultimaConsulta) - this.parseDate(a.ultimaConsulta);
      } else if (filter === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (filter === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return this.sortAsc ? cmp : -cmp;
    });
    this.patients.set(sorted);
  }

  private parseDate(dateStr?: string): number {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    return d.getTime() || 0;
  }

  async onRowAction(event: { patient: TablePatient; event: MouseEvent }) {
    const popover = await this.popoverController.create({
      component: GynoActionPopoverComponent,
      componentProps: { patientName: event.patient.name },
      event: event.event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
    const { data } = await popover.onWillDismiss();
    if (data?.action) {
      console.log(`Action "${data.action}" for ${event.patient.name}`);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onAddConsultation() {
    console.log('Add consultation');
  }
}

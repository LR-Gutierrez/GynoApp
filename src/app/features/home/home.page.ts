import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { calculateAge } from 'src/app/shared/models/patient.model';
import { GynoSearchBarComponent } from 'src/app/shared/components/gyno-search-bar/gyno-search-bar.component';
import { GynoSectionHeaderComponent } from 'src/app/shared/components/gyno-section-header/gyno-section-header.component';
import { GynoHorizontalScrollComponent } from 'src/app/shared/components/gyno-horizontal-scroll/gyno-horizontal-scroll.component';
import { GynoRecentCardComponent, RecentPatient } from 'src/app/shared/components/gyno-recent-card/gyno-recent-card.component';
import { GynoPatientTableComponent, TablePatient } from 'src/app/shared/components/gyno-patient-table/gyno-patient-table.component';
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
    GynoBottomNavComponent,
    GynoFilterPopoverComponent,
    GynoActionPopoverComponent,
    GynoTopbarComponent,
  ],
})
export class HomePage {
  private router = inject(Router);
  private popoverController = inject(PopoverController);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);

  readonly loading = signal(true);
  readonly patients = signal<TablePatient[]>([]);
  readonly recentPatients = signal<RecentPatient[]>([]);

  currentPage = 1;
  pageSize = 5;
  totalCount = 0;

  sortField = '';
  private sortAsc = true;
  private allPatients: TablePatient[] = [];
  private searchQuery = '';

  async ionViewWillEnter() {
    this.loading.set(true);
    try {
      await this.loadPatients();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPatients() {
    const patients = await this.patientService.getAll();
    const mapped: TablePatient[] = [];
    const allCons: { patientId: string; date: string; consultationId: string; motivo: string }[] = [];
    for (const p of patients) {
      const consultations = await this.consultationService.getByPatient(p.id);
      const latest = consultations[0];
      mapped.push({
        ...p,
        age: calculateAge(p.birthDate),
        ultimaConsulta: latest ? this.formatDate(latest.date) : undefined,
      });
      for (const c of consultations) {
        allCons.push({ patientId: p.id, date: c.date, consultationId: c.id, motivo: c.motivo });
      }
    }
    this.allPatients = mapped;
    this.applySearch();

    allCons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const top5 = allCons.slice(0, 5);
    const recent: RecentPatient[] = [];
    for (const c of top5) {
      const p = patients.find(x => x.id === c.patientId);
      if (p) {
        const d = new Date(c.date);
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        recent.push({
          id: p.id,
          name: p.name,
          age: calculateAge(p.birthDate),
          consultationId: c.consultationId,
          motivo: c.motivo,
          lastVisitDate: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
          lastVisitTime: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        });
      }
    }
    this.recentPatients.set(recent);
  }

  private applySearch() {
    const filtered = this.searchQuery
      ? this.allPatients.filter((p) =>
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
        )
      : [...this.allPatients];
    this.totalCount = filtered.length;
    this.patients.set(filtered);
  }

  private formatDate(iso: string): string {
    const d = new Date(iso);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  onSearch(value: string) {
    this.searchQuery = value;
    this.currentPage = 1;
    this.applySearch();
  }

  onRecentCardClicked(patient: RecentPatient) {
    this.router.navigate(['/home/patient', patient.id]);
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
      this.applySearch();
      return;
    }
    if (this.sortField === filter) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = filter;
      this.sortAsc = true;
    }
    const sorted = [...this.patients()].sort((a, b) => {
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
    if (data?.action === 'profile') {
      this.router.navigate(['/home/patient', event.patient.id]);
    } else if (data?.action) {
      console.log(`Action "${data.action}" for ${event.patient.name}`);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onAddConsultation() {
    this.router.navigate(['/home/patient/new']);
  }
}

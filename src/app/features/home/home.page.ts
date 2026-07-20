import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from 'src/app/core/services/patient.service';
import { ConsultationService } from 'src/app/core/services/consultation.service';
import { SettingsService } from 'src/app/core/services/settings.service';
import { Patient, calculateAge } from 'src/app/shared/models/patient.model';
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
  styles: [
    `
      :host i[class^='mgc_']::before,
      :host i[class*=' mgc_']::before {
        color: inherit !important;
      }

      .advanced-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        border: 1px dashed var(--color-outline-variant);
        border-radius: 10px;
        background: transparent;
        color: var(--color-on-surface-variant);
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
      }
      .advanced-toggle:hover {
        border-color: var(--color-primary-600);
        color: var(--color-primary-600);
      }
      .advanced-toggle .chevron { transition: transform 0.25s ease; }
      .advanced-toggle .chevron.rotated { transform: rotate(180deg); }
      .advanced-toggle .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 50%;
        background: var(--color-primary-600);
        color: #fff !important;
      }

      .advanced-panel {
        background: var(--color-surface-container-low);
        border: 1px solid var(--color-outline-variant);
        border-radius: 12px;
      }
      .advanced-panel .filter-field {
        --background: transparent;
        --padding-start: 0;
        --padding-end: 0;
        --inner-padding-end: 0;
        --border-color: var(--color-outline-variant);
        --border-radius: 8px;
        border: 1px solid var(--color-outline-variant);
        border-radius: 8px;
        padding: 0 10px;
      }

      .status-chip {
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        border: 1px solid var(--color-outline-variant);
        background: transparent;
        color: var(--color-on-surface-variant);
        cursor: pointer;
        transition: all 0.2s;
      }
      .status-chip.active {
        background: var(--color-primary-600);
        color: #fff;
        border-color: var(--color-primary-600);
      }

      .filter-chips .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        font-size: 12px;
        border-radius: 16px;
        background: var(--color-primary-600);
        color: #fff;
        border: none;
        cursor: pointer;
      }
    `,
  ],
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
  private alertController = inject(AlertController);
  private patientService = inject(PatientService);
  private consultationService = inject(ConsultationService);
  private settings = inject(SettingsService);

  private timeFormat: '12h' | '24h' = '24h';

  readonly loading = signal(true);
  readonly patients = signal<TablePatient[]>([]);
  readonly recentPatients = signal<RecentPatient[]>([]);

  currentPage = 1;
  pageSize = 5;
  totalCount = 0;

  sortField = '';
  private sortAsc = true;
  private allPatients: TablePatient[] = [];
  private allCons: { patientId: string; date: string; consultationId: string; motivo: string; time?: string }[] = [];
  private patientsLookup: Patient[] = [];
  private searchQuery = '';

  // Advanced search state
  readonly advancedOpen = signal(false);
  ageMin: number | null = null;
  ageMax: number | null = null;
  dateFrom: string = '';
  dateTo: string = '';
  statusFilter: '' | 'activa' | 'inactiva' = '';

  get activeFilterCount(): number {
    let count = 0;
    if (this.ageMin !== null || this.ageMax !== null) count++;
    if (this.dateFrom || this.dateTo) count++;
    if (this.statusFilter) count++;
    return count;
  }

  async ionViewWillEnter() {
    this.loading.set(true);
    try {
      this.timeFormat = await this.settings.getTimeFormat();
      await this.loadPatients();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPatients() {
    this.patientsLookup = await this.patientService.getAll();
    const allConsultations = await this.consultationService.getAll();

    const consByPatient: Record<string, typeof allConsultations> = {};
    this.allCons = [];
    for (const c of allConsultations) {
      if (!consByPatient[c.patientId]) consByPatient[c.patientId] = [];
      consByPatient[c.patientId].push(c);
      this.allCons.push({ patientId: c.patientId, date: c.date, consultationId: c.id, motivo: c.motivo, time: c.time });
    }

    const mapped: TablePatient[] = this.patientsLookup.map(p => {
      const patientCons = consByPatient[p.id] ?? [];
      const latest = patientCons[0];
      return {
        ...p,
        age: calculateAge(p.birthDate),
        ultimaConsulta: latest ? this.formatDate(latest.date) : undefined,
      };
    });
    this.allPatients = mapped;
    this.applySearch();
  }

  private applySearch() {
    const q = this.searchQuery.toLowerCase().trim();
    let filtered: TablePatient[];

    // 1. Text search (name, cedula, phone, motivo)
    if (q) {
      const matchingIds = new Set<string>();
      for (const p of this.allPatients) {
        if (p.name.toLowerCase().includes(q) ||
            (p.cedula && p.cedula.toLowerCase().includes(q)) ||
            p.phone.toLowerCase().includes(q)) {
          matchingIds.add(p.id);
        }
      }
      for (const c of this.allCons) {
        if (c.motivo.toLowerCase().includes(q)) {
          matchingIds.add(c.patientId);
        }
      }
      filtered = this.allPatients.filter(p => matchingIds.has(p.id));
    } else {
      filtered = [...this.allPatients];
    }

    // 2. Age range filter
    if (this.ageMin !== null || this.ageMax !== null) {
      filtered = filtered.filter(p => {
        const age = calculateAge(p.birthDate);
        if (this.ageMin !== null && age < this.ageMin) return false;
        if (this.ageMax !== null && age > this.ageMax) return false;
        return true;
      });
    }

    // 3. Date range filter (last consultation)
    if (this.dateFrom || this.dateTo) {
      const fromMs = this.dateFrom ? new Date(this.dateFrom).getTime() : 0;
      const toMs = this.dateTo ? new Date(this.dateTo).getTime() + 86400000 : Infinity;
      filtered = filtered.filter(p => {
        const conDates = this.allCons
          .filter(c => c.patientId === p.id)
          .map(c => new Date(c.date).getTime())
          .sort((a, b) => b - a);
        if (conDates.length === 0) return false;
        const latest = conDates[0];
        return latest >= fromMs && latest < toMs;
      });
    }

    // 4. Status filter
    if (this.statusFilter) {
      const sixMonthsAgo = Date.now() - 180 * 86400000;
      filtered = filtered.filter(p => {
        const conDates = this.allCons
          .filter(c => c.patientId === p.id)
          .map(c => new Date(c.date).getTime())
          .sort((a, b) => b - a);
        const latest = conDates[0] || 0;
        if (this.statusFilter === 'activa') return latest >= sixMonthsAgo;
        return latest < sixMonthsAgo;
      });
    }

    this.totalCount = filtered.length;

    const start = (this.currentPage - 1) * this.pageSize;
    this.patients.set(filtered.slice(start, start + this.pageSize));

    const filteredIds = new Set(filtered.map(p => p.id));
    this.applyRecentFilter(filteredIds);
  }

  private applyRecentFilter(filteredIds: Set<string>) {
    const recentCons = this.allCons
      .filter(c => filteredIds.has(c.patientId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    this.recentPatients.set(
      recentCons.map(c => {
        const p = this.patientsLookup.find(x => x.id === c.patientId)!;
        const d = new Date(c.date);
        return {
          id: p.id,
          name: p.name,
          age: calculateAge(p.birthDate),
          consultationId: c.consultationId,
          motivo: c.motivo,
          lastVisitDate: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
          lastVisitTime: this.settings.formatTime(c.time, this.timeFormat),
        };
      })
    );
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

  toggleAdvanced() {
    this.advancedOpen.update(v => !v);
  }

  applyAdvancedFilters() {
    this.currentPage = 1;
    this.applySearch();
    this.advancedOpen.set(false);
  }

  clearAdvancedFilters() {
    this.ageMin = null;
    this.ageMax = null;
    this.dateFrom = '';
    this.dateTo = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.applySearch();
  }

  removeFilter(type: 'age' | 'date' | 'status') {
    if (type === 'age') { this.ageMin = null; this.ageMax = null; }
    if (type === 'date') { this.dateFrom = ''; this.dateTo = ''; }
    if (type === 'status') { this.statusFilter = ''; }
    this.currentPage = 1;
    this.applySearch();
  }

  onRecentPatientClicked(patient: RecentPatient) {
    this.router.navigate(['/home/patient', patient.id]);
  }

  onRecentConsultationClicked(patient: RecentPatient) {
    this.router.navigate(['/home/patient', patient.id, 'consultation', patient.consultationId]);
  }

  onViewAll() {
    this.router.navigate(['/home/recent-consultations']);
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
    const patient = event.patient;
    if (data?.action === 'history') {
      this.router.navigate(['/home/patient', patient.id]);
    } else if (data?.action === 'edit') {
      this.router.navigate(['/home/patient', patient.id, 'edit']);
    } else if (data?.action === 'delete') {
      this.deletePatient(patient);
    }
  }

  private async deletePatient(patient: TablePatient) {
    const alert = await this.alertController.create({
      header: 'Eliminar paciente',
      message: `¿Estás segura de eliminar a ${patient.name}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.patientService.delete(patient.id);
            await this.loadPatients();
          },
        },
      ],
    });
    await alert.present();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.applySearch();
  }

  onAddConsultation() {
    this.router.navigate(['/home/patient/new']);
  }
}

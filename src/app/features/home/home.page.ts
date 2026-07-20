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
    const mapped: TablePatient[] = [];
    this.allCons = [];
    for (const p of this.patientsLookup) {
      const consultations = await this.consultationService.getByPatient(p.id);
      const latest = consultations[0];
      mapped.push({
        ...p,
        age: calculateAge(p.birthDate),
        ultimaConsulta: latest ? this.formatDate(latest.date) : undefined,
      });
      for (const c of consultations) {
        this.allCons.push({ patientId: p.id, date: c.date, consultationId: c.id, motivo: c.motivo, time: c.time });
      }
    }
    this.allPatients = mapped;
    this.applySearch();
  }

  private applySearch() {
    const filtered = this.searchQuery
      ? this.allPatients.filter((p) =>
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase()),
        )
      : [...this.allPatients];
    this.totalCount = filtered.length;
    this.patients.set(filtered);

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
  }

  onAddConsultation() {
    this.router.navigate(['/home/patient/new']);
  }
}

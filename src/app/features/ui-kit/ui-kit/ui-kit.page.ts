import { Component, inject } from '@angular/core';
import { IonicModule, ToastController, AlertController, PopoverController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-kit',
  templateUrl: './ui-kit.page.html',
  styleUrls: ['./ui-kit.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UiKitPage {
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private popoverController = inject(PopoverController);

  showLoading = false;
  showConfirm = false;
  searchValue = '';
  formValue = '';
  formError: string | null = null;

  constructor() {
    setTimeout(() => {
      this.formError = 'Este campo es requerido';
    }, 1500);
  }

  toggleLoading() {
    this.showLoading = !this.showLoading;
    if (this.showLoading) {
      setTimeout(() => {
        this.showLoading = false;
      }, 3000);
    }
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  async showToast() {
    const toast = await this.toastController.create({
      message: '¡Acción completada exitosamente!',
      duration: 3000,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  async showAlert() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      subHeader: '¿Estás seguro?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            console.log('Confirmado');
          },
        },
      ],
    });
    await alert.present();
  }

  async openProfileActionPopover(event: MouseEvent) {
    const popover = await this.popoverController.create({
      component: ProfileActionPopoverComponent,
      event: event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
  }

  async openFilterPopover(event: MouseEvent) {
    const popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      event: event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
  }

  async openActionPopover(event: MouseEvent, patientName: string) {
    const popover = await this.popoverController.create({
      component: ActionPopoverComponent,
      componentProps: { patientName },
      event: event,
      side: 'bottom',
      alignment: 'start',
      showBackdrop: false,
    });
    await popover.present();
  }

  onAction(action: string) {
    console.log('Action:', action);
  }

  handleConfirm() {
    console.log('Confirmado');
    this.showConfirm = false;
  }

  onSearch(event: any) {
    console.log('Search:', event.target?.value || event);
    this.searchValue = event.target?.value || '';
  }

  clearSearch() {
    this.searchValue = '';
    console.log('Search cleared');
  }
}

@Component({
  selector: 'app-profile-action-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()">
        <ion-icon name="create-outline" slot="start"></ion-icon>
        Editar perfil
      </ion-item>
      <ion-item button (click)="close()">
        <ion-icon name="call-outline" slot="start"></ion-icon>
        Llamar
      </ion-item>
      <ion-item button (click)="close()">
        <ion-icon name="chatbubble-ellipses-outline" slot="start"></ion-icon>
        Enviar mensaje
      </ion-item>
      <ion-item button lines="none" (click)="close()">
        <ion-icon name="document-text-outline" slot="start"></ion-icon>
        Ver historial
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class ProfileActionPopoverComponent {
  private popoverController = inject(PopoverController);
  close() {
    this.popoverController.dismiss();
  }
}

@Component({
  selector: 'app-filter-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()">Por fecha</ion-item>
      <ion-item button (click)="close()">Por nombre</ion-item>
      <ion-item button (click)="close()">Por estado</ion-item>
      <ion-item button (click)="close()">Limpiar filtros</ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class FilterPopoverComponent {
  private popoverController = inject(PopoverController);
  close() {
    this.popoverController.dismiss();
  }
}

@Component({
  selector: 'app-action-popover',
  template: `
    <ion-list>
      <ion-item button (click)="close()">Ver perfil</ion-item>
      <ion-item button (click)="close()">Editar</ion-item>
      <ion-item button (click)="close()">Historial</ion-item>
      <ion-item button lines="none" (click)="close()">Eliminar</ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [IonicModule],
})
export class ActionPopoverComponent {
  private popoverController = inject(PopoverController);
  close() {
    this.popoverController.dismiss();
  }
}

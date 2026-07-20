import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { AlertController } from '@ionic/angular';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

@Injectable({ providedIn: 'root' })
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  private alertCtrl = inject(AlertController);

  async canDeactivate(component: CanComponentDeactivate): Promise<boolean> {
    if (!component.canDeactivate) return true;
    const can = await component.canDeactivate();
    if (can) return true;

    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: '¿Descartar cambios?',
        message: 'Tienes cambios sin guardar. ¿Estás segura de que quieres salir?',
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: 'Descartar', role: 'destructive', handler: () => resolve(true) },
        ],
      });
      await alert.present();
    });
  }
}

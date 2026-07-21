import { Component, inject, OnInit } from '@angular/core';
import { SessionService } from './core/services/session.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private notificationService = inject(NotificationService);

  constructor() {
    inject(SessionService);
  }

  async ngOnInit() {
    try {
      await this.notificationService.init();
    } catch {
    }
  }
}

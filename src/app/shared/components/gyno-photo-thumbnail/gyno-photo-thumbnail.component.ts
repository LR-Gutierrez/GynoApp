import { Component, input, output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'gyno-photo-thumbnail',
  templateUrl: './gyno-photo-thumbnail.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class GynoPhotoThumbnailComponent {
  readonly type = input<'placeholder' | 'loading' | 'encrypted' | 'camera'>('placeholder');
  readonly src = input<string>('');
  readonly encrypted = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly clicked = output<void>();
}

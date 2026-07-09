import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'gync-avatar',
  template: `
    <div
      class="rounded-full flex items-center justify-center shrink-0 font-sans font-bold border border-[rgba(15,82,186,0.06)] select-none"
      [class.w-9.5]="size() === 'md'"
      [class.h-9.5]="size() === 'md'"
      [class.text-sm]="size() === 'md'"
      [class.w-8]="size() === 'sm'"
      [class.h-8]="size() === 'sm'"
      [class.text-xs]="size() === 'sm'"
      [class.w-12]="size() === 'lg'"
      [class.h-12]="size() === 'lg'"
      [class.text-base]="size() === 'lg'"
      [class]="bgClass()"
    >
      {{ initials() }}
    </div>
  `,
  standalone: true,
})
export class GyncAvatarComponent {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  );

  readonly bgClass = computed(() => {
    const palettes = [
      'bg-[#edf3ff] text-[#30568b]',
      'bg-[#d9fbf6] text-[#136c70]',
      'bg-[#edf3ff] text-[#30568b]',
    ];
    return palettes[this.name().length % palettes.length];
  });
}

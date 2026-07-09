import type { MaskitoOptions } from '@maskito/core';

export const cedulaMask: MaskitoOptions = {
  mask: [
    /[VEJPGvejpg]/,
    '-',
    ...Array(8).fill(/\d/),
  ],
};

export const phoneMask: MaskitoOptions = {
  mask: [
    '0', '4', /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/,
  ],
};

export const digitsOnlyMask: MaskitoOptions = {
  mask: /\d/,
};

export const lettersOnlyMask: MaskitoOptions = {
  mask: /[a-zA-ZñÑáéíóúüÁÉÍÓÚÜ\s]/,
};

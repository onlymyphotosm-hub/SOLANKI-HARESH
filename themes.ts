export interface Theme {
  name: string;
  displayName: string;
  previewColors: string[];
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    textHeader: string;
    accent: string;
    accentActive: string;
    accentLight: string;
    accentDark: string;
    progressBase: string;
    progressFill: string;
    buttonHover: string;
    modalBg: string;
    modalHeaderBorder: string;
    listItemBackground: string;
    listItemBorder: string;
    confirmButton: string;
    cancelButton: string;
    cancelButtonHover: string;
    metaThemeColor: string;
  };
}

export const themes: Record<string, Theme> = {
  amber: {
    name: 'amber',
    displayName: 'Amber',
    previewColors: ['#fef3c7', '#fde68a', '#fbbf24', '#b45309'],
    colors: {
      metaThemeColor: '#fffbeb',
      background: 'bg-amber-50',
      textPrimary: 'text-stone-800',
      textSecondary: 'text-stone-500',
      textHeader: 'text-amber-800',
      accent: 'bg-amber-200',
      accentActive: 'group-active:bg-amber-300',
      accentLight: 'bg-amber-100',
      accentDark: 'text-amber-900',
      progressBase: 'stroke-amber-200',
      progressFill: 'stroke-amber-500',
      buttonHover: 'hover:bg-amber-100',
      modalBg: 'bg-amber-50',
      modalHeaderBorder: 'border-amber-200',
      listItemBackground: 'bg-white',
      listItemBorder: 'border-amber-100',
      confirmButton: 'bg-red-500 hover:bg-red-600',
      cancelButton: 'bg-amber-200',
      cancelButtonHover: 'hover:bg-amber-300',
    }
  },
  forest: {
    name: 'forest',
    displayName: 'Forest',
    previewColors: ['#f0fdf4', '#bbf7d0', '#4ade80', '#15803d'],
    colors: {
      metaThemeColor: '#ecfdf5',
      background: 'bg-green-50',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-500',
      textHeader: 'text-green-800',
      accent: 'bg-green-200',
      accentActive: 'group-active:bg-green-300',
      accentLight: 'bg-green-100',
      accentDark: 'text-green-900',
      progressBase: 'stroke-green-200',
      progressFill: 'stroke-green-500',
      buttonHover: 'hover:bg-green-100',
      modalBg: 'bg-green-50',
      modalHeaderBorder: 'border-green-200',
      listItemBackground: 'bg-white',
      listItemBorder: 'border-green-100',
      confirmButton: 'bg-red-500 hover:bg-red-600',
      cancelButton: 'bg-green-200',
      cancelButtonHover: 'hover:bg-green-300',
    }
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean',
    previewColors: ['#f0f9ff', '#bae6fd', '#38bdf8', '#0369a1'],
    colors: {
      metaThemeColor: '#eff6ff',
      background: 'bg-blue-50',
      textPrimary: 'text-slate-800',
      textSecondary: 'text-slate-500',
      textHeader: 'text-blue-800',
      accent: 'bg-blue-200',
      accentActive: 'group-active:bg-blue-300',
      accentLight: 'bg-blue-100',
      accentDark: 'text-blue-900',
      progressBase: 'stroke-blue-200',
      progressFill: 'stroke-blue-500',
      buttonHover: 'hover:bg-blue-100',
      modalBg: 'bg-blue-50',
      modalHeaderBorder: 'border-blue-200',
      listItemBackground: 'bg-white',
      listItemBorder: 'border-blue-100',
      confirmButton: 'bg-red-500 hover:bg-red-600',
      cancelButton: 'bg-blue-200',
      cancelButtonHover: 'hover:bg-blue-300',
    }
  },
  rose: {
    name: 'rose',
    displayName: 'Rose',
    previewColors: ['#fff1f2', '#fecdd3', '#fb7185', '#be123c'],
    colors: {
      metaThemeColor: '#fff1f2',
      background: 'bg-rose-50',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-500',
      textHeader: 'text-rose-800',
      accent: 'bg-rose-200',
      accentActive: 'group-active:bg-rose-300',
      accentLight: 'bg-rose-100',
      accentDark: 'text-rose-900',
      progressBase: 'stroke-rose-200',
      progressFill: 'stroke-rose-500',
      buttonHover: 'hover:bg-rose-100',
      modalBg: 'bg-rose-50',
      modalHeaderBorder: 'border-rose-200',
      listItemBackground: 'bg-white',
      listItemBorder: 'border-rose-100',
      confirmButton: 'bg-red-500 hover:bg-red-600',
      cancelButton: 'bg-rose-200',
      cancelButtonHover: 'hover:bg-rose-300',
    }
  }
};

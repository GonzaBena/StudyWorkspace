export type ShortcutAction =
  | 'page.next'
  | 'page.prev'
  | 'zoom.in'
  | 'zoom.out'
  | 'zoom.fitWidth'
  | 'zoom.fitHeight'
  | 'mode.pan'
  | 'mode.select'
  | 'view.toggle'
  | 'rotate.cw'
  | 'rotate.ccw'
  | 'bookmark.toggle';

export interface Shortcut {
  key: string;
  /** undefined = don't check; true/false = must match */
  ctrl?:  boolean;
  meta?:  boolean;
  shift?: boolean;
  action: ShortcutAction;
  label:       string; // key shown in the UI
  description: string;
}

export const SHORTCUTS: Shortcut[] = [
  // Page navigation
  { key: 'ArrowRight', action: 'page.next', label: '→', description: 'Página siguiente' },
  { key: 'ArrowDown',  action: 'page.next', label: '↓', description: 'Página siguiente' },
  { key: 'ArrowLeft',  action: 'page.prev', label: '←', description: 'Página anterior' },
  { key: 'ArrowUp',    action: 'page.prev', label: '↑', description: 'Página anterior' },

  // Zoom — guard against browser shortcuts (Ctrl/Cmd ±)
  { key: '+', ctrl: false, meta: false, action: 'zoom.in',        label: '+', description: 'Ampliar' },
  { key: '=', ctrl: false, meta: false, action: 'zoom.in',        label: '=', description: 'Ampliar' },
  { key: '-', ctrl: false, meta: false, action: 'zoom.out',       label: '-', description: 'Reducir' },
  { key: 'w', ctrl: false, meta: false, action: 'zoom.fitWidth',  label: 'W', description: 'Ajustar al ancho' },
  { key: 'e', ctrl: false, meta: false, action: 'zoom.fitHeight', label: 'E', description: 'Ajustar al alto' },

  // Interaction mode
  { key: 'h', ctrl: false, meta: false, action: 'mode.pan',    label: 'H', description: 'Modo paneo' },
  { key: 'v', ctrl: false, meta: false, action: 'mode.select', label: 'V', description: 'Modo selección' },

  // View
  { key: 'c', ctrl: false, meta: false, action: 'view.toggle', label: 'C', description: 'Alternar vista continua' },

  // Rotation
  { key: 'r', ctrl: false, meta: false, action: 'rotate.cw',  label: 'R', description: 'Rotar a la derecha' },
  { key: '[', ctrl: false, meta: false, action: 'rotate.ccw', label: '[', description: 'Rotar a la izquierda' },

  // Bookmarks
  { key: 'b', ctrl: false, meta: false, action: 'bookmark.toggle', label: 'B', description: 'Marcar / desmarcar página' },
];

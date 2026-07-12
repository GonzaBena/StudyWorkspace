import type { Session } from '../types';
import type { NotesMap } from './db';
import { parseMarkdown } from './markdown';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportSessionToPdf(session: Session, allNotes: Record<string, NotesMap>) {
  const stats = session.stats ?? {
    pomodorosCompleted: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    timePerFile: {},
  };

  const totalTime = Object.values(stats.timePerFile).reduce((a, b) => a + b, 0);

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Sesión - ${escapeHtml(session.name)}</title>
  <style>
    :root {
      --primary: #0088cc;
      --text: #222222;
      --text-muted: #666666;
      --border: #dddddd;
      --bg: #fafafa;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--text);
      line-height: 1.5;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: var(--primary);
    }
    .date {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .section-title {
      font-size: 1.25rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: var(--primary);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-val {
      font-size: 1.4rem;
      font-weight: bold;
      color: var(--primary);
      margin-bottom: 4px;
    }
    .stat-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      font-size: 0.9rem;
    }
    th {
      background: var(--bg);
      font-weight: 600;
    }
    .note-item {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .note-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .note-quote {
      font-style: italic;
      border-left: 3px solid var(--primary);
      padding-left: 8px;
      color: var(--text-muted);
      margin: 8px 0;
      font-size: 0.85rem;
    }
    .note-content {
      font-size: 0.9rem;
    }
    .note-content p {
      margin: 0 0 6px 0;
    }
    .note-content ul {
      margin: 4px 0 6px 16px;
      padding: 0;
    }
    .note-content code {
      background: #eeeeee;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .note-content pre {
      background: #f4f4f4;
      padding: 8px;
      border-radius: 6px;
      overflow-x: auto;
      border: 1px solid var(--border);
    }
    @media print {
      body {
        margin: 20px;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
      header {
        border-bottom-color: #000;
      }
      h1, .section-title {
        color: #000;
      }
      .stat-val {
        color: #000;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #e5f5fc; border: 1px solid #bce1f2; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 0.9rem; color: #1e5c7a;">Esta es la vista de impresión. Usa la opción "Guardar como PDF" en la ventana de impresión del navegador.</span>
    <button onclick="window.print()" style="background: var(--primary); border: none; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Imprimir / Exportar PDF</button>
  </div>

  <header>
    <div>
      <h1>Estadísticas de Sesión</h1>
      <div style="font-size: 1.1rem; font-weight: bold; margin-top: 4px;">${escapeHtml(session.name)}</div>
    </div>
    <div class="date">Generado el ${new Date().toLocaleDateString()}</div>
  </header>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val">${stats.pomodorosCompleted}</div>
      <div class="stat-lbl">Pomodoros Realizados</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${formatDuration(totalTime)}</div>
      <div class="stat-lbl">Tiempo de Estudio</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${formatDuration(stats.totalBreakTime)}</div>
      <div class="stat-lbl">Tiempo de Descanso</div>
    </div>
  </div>

  <h2 class="section-title">Archivos de la Sesión</h2>
  <table>
    <thead>
      <tr>
        <th>Archivo</th>
        <th>Progreso</th>
        <th>Estado</th>
        <th>Tiempo Dedicado</th>
      </tr>
    </thead>
    <tbody>
      ${session.files.map(f => {
        const pct = f.totalPages > 0 ? Math.round((f.currentPage / f.totalPages) * 100) : 0;
        const fileTime = stats.timePerFile[f.id] ?? 0;
        return `
          <tr>
            <td>${escapeHtml(f.name)}</td>
            <td>Pg. ${f.currentPage} / ${f.totalPages || '?'} (${pct}%)</td>
            <td>${f.completed ? 'Completado ✅' : 'En progreso ⏳'}</td>
            <td>${formatDuration(fileTime)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2 class="section-title">Notas Tomadas</h2>
  <div style="margin-top: 12px;">
    ${session.files.map(file => {
      const fileNotes = allNotes[file.id] || {};
      const notesList = Object.entries(fileNotes)
        .flatMap(([p, arr]) => arr.map(n => ({ ...n, page: Number(p) })))
        .sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);

      if (notesList.length === 0) return '';

      return `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="font-size: 1rem; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px;">${escapeHtml(file.name)}</h3>
          ${notesList.map(note => `
            <div class="note-item">
              <div class="note-header">
                <span>Página ${note.page}</span>
                <span>${note.createdAt > 0 ? new Date(note.createdAt).toLocaleDateString() : ''}</span>
              </div>
              ${note.selectedText ? `
                <div class="note-quote">
                  "${escapeHtml(note.selectedText)}"
                </div>
              ` : ''}
              <div class="note-content">
                ${parseMarkdown(note.text)}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
    ${Object.values(allNotes).every(nMap => Object.keys(nMap).length === 0) 
      ? '<p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">No se tomaron notas en esta sesión.</p>' 
      : ''
    }
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  } else {
    URL.revokeObjectURL(url);
    alert('Por favor, permite las ventanas emergentes (popups) para poder exportar a PDF.');
  }
}

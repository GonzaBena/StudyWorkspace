# StudyProgress 📚

**StudyProgress** es una aplicación web diseñada para ayudar a los estudiantes a gestionar y leer sus documentos de estudio (PDFs) haciendo un seguimiento de su progreso. Construida con React, TypeScript y Vite.

## ✨ Características

- **Visualizador de PDF integrado:** Lee tus documentos PDF directamente en el navegador de manera cómoda.
- **Seguimiento de Progreso:** La aplicación guarda la página exacta en la que te quedaste en cada documento.
- **Gestión de Sesiones:** Agrupa múltiples documentos en "Sesiones de Estudio" y retómalas cuando quieras.
- **Marcadores (Bookmarks):** Guarda páginas importantes de tus PDFs para acceder a ellas rápidamente.
- **Modo Oscuro y Modo Invertido:** Cuida tu vista con el modo oscuro general y la opción de invertir los colores de los documentos PDF.
- **Privacidad y Funcionamiento Local:** Tus archivos y el progreso de lectura se procesan y almacenan localmente en tu navegador.

## 🚀 Tecnologías

- **React 19**
- **TypeScript**
- **Vite**
- **react-pdf**
- **animejs** (animaciones fluidas)
- **canvas-confetti**

## 📦 Instalación y Uso

1. **Abre una terminal en el directorio del proyecto:**

   ```bash
   cd study-app
   ```

2. **Instala las dependencias:**
   Se recomienda usar `pnpm` (que es el gestor de paquetes actual del proyecto), pero también puedes usar `npm` o `yarn`.

   ```bash
   pnpm install
   ```

3. **Inicia el servidor de desarrollo:**

   ```bash
   pnpm run dev
   ```

4. **Abre en el navegador:**
   La aplicación estará disponible típicamente en `http://localhost:5173`.

## 🏗️ Construcción para Producción

Para compilar la aplicación para producción, ejecuta:

```bash
pnpm run build
```

Esto generará los archivos estáticos optimizados en la carpeta `dist`, listos para ser desplegados.

# Portfolio · Jésica Bernal Galindo

Portfolio personal de **Game QA Tester** y estudiante de **Desarrollo de Aplicaciones Multiplataforma (DAM)**.
Hecho con **React 19 + Vite**, con estética pixel art (paleta *Sweetie 16*) y sin librerías externas de
animación, juegos ni UI: todo el movimiento, los minijuegos y los sonidos están programados a mano.
La única excepción es **three.js**, que solo usa el modo Paper 3D (y solo se descarga al abrirlo).

El portfolio tiene **cuatro modos** con el mismo contenido:

| Modo | Qué es | Pensado para |
|---|---|---|
| **Classic** | Web de una sola página con todas las secciones, minijuego *Bug Invaders*, mapa del viaje y easter eggs. | Quien quiere leerlo rápido (≈ 2 min). |
| **Cinematic** | Escenas que se animan al hacer scroll, al estilo de la web de GTA VI. | Una presentación más espectacular (≈ 4 min). |
| **Game** | *QA Quest*: un plataformas donde cada sección del portfolio es un lugar del nivel. | Jugar y explorar (≈ 5 min). |
| **Paper 3D** | *Paper Quest*: un mundo 3D tipo diorama donde personajes, edificios y objetos son recortes de papel pixel art (estilo *Paper Mario*). | Explorar en 3D (≈ 5 min). |

La primera vez que alguien entra ve la pantalla **SELECT MODE** para elegir. Después puede cambiar
en cualquier momento con la barra **MODE** de abajo a la izquierda.

---

## Puesta en marcha

Requisitos: **Node.js 20 o superior** (probado con Node 24).

```bash
npm install        # instala dependencias (solo la primera vez)
npm run dev        # servidor de desarrollo → http://localhost:5173
npm run build      # genera la web final en /dist
npm run preview    # sirve /dist para probar la versión final
```

Enlaces útiles en local:

| URL | Qué hace |
|---|---|
| `http://localhost:5173/` | Muestra la pantalla de selección (o el último modo elegido). |
| `?v=classic` · `?v=scroll` · `?v=game` | Abre directamente ese modo. Útil para compartir un enlace concreto. |
| `?select` | Fuerza la pantalla de selección aunque ya haya un modo guardado. |

---

## Cambiar el contenido

**Todo el texto, los juegos, la experiencia, las skills y los enlaces están en un único archivo:**
[`src/data/portfolio.js`](src/data/portfolio.js). Al editarlo se actualizan los cuatro modos a la vez.

Guía completa campo por campo → [docs/contenido.md](docs/contenido.md).

Resumen rápido:

- **Imágenes de juegos** → `public/images/games/` (formato cabecera de Steam, 460×215).
- **Renders de Blender** → `public/images/blender/`.
- **CV** → `public/cv.pdf` (el botón "Download CV" apunta ahí).
- **Colores del avatar** → objeto `avatar` en `portfolio.js`.
- **Colores y fuentes de la web** → [`src/styles/theme.css`](src/styles/theme.css).

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/contenido.md](docs/contenido.md) | Cómo editar textos, juegos, trayectoria, skills, imágenes y enlaces. |
| [docs/modos.md](docs/modos.md) | Qué hace cada modo, sus secciones, controles y easter eggs. |
| [docs/arquitectura.md](docs/arquitectura.md) | Estructura del código, cómo funciona cada motor (scroll, juego, sonido) y cómo ampliarlo. |

---

## Estructura en un vistazo

```
Portfolio/
├── index.html              # HTML base, fuentes de Google (Press Start 2P, VT323)
├── vite.config.js          # base: './' para poder publicarlo en cualquier carpeta
├── public/                 # archivos que se copian tal cual (imágenes, favicon, CV)
└── src/
    ├── main.jsx            # punto de entrada: monta <Root/> y los estilos globales
    ├── Root.jsx            # elige el modo (selección, URL, memoria) y pinta la barra MODE
    ├── App.jsx             # modo Classic
    ├── data/portfolio.js   # ⭐ TODO el contenido del portfolio
    ├── components/         # componentes del modo Classic + selector de modos
    ├── variants/
    │   ├── shared.jsx      # avatar pixel y botón de sonido compartidos
    │   ├── scroll/         # modo Cinematic
    │   ├── game/           # modo Game (motor de plataformas en <canvas>)
    │   └── paper/          # modo Paper 3D (diorama three.js con recortes de papel)
    ├── sound.js            # efectos 8-bit generados con Web Audio (sin archivos de audio)
    ├── sprites.js          # sprites de bichos y nave
    ├── assets/             # cursores pixel
    └── styles/             # theme, global (Classic), switcher, scroll, game, paper
```

---

## Publicar

`npm run build` genera la carpeta `dist/`, que es una web estática. Opciones:

- **Netlify / Vercel**: arrastrar la carpeta `dist/` o conectar el repositorio (comando `npm run build`, carpeta `dist`).
- **GitHub Pages**: subir el contenido de `dist/`. `vite.config.js` ya usa `base: './'`, así que funciona
  también dentro de una subcarpeta (`usuario.github.io/portfolio/`).

---

## Tecnologías

- **React 19** (componentes y hooks, sin librerías de estado).
- **Vite 8** (desarrollo y build).
- **CSS puro** con variables (`theme.css`) y animaciones por pasos (`steps()`) para el efecto pixel.
- **Canvas 2D** para *Bug Invaders*, los bichos del fondo y el modo Game.
- **three.js (WebGL)** para el mundo 3D del modo Paper 3D.
- **SVG** para el avatar y el mapa de la trayectoria.
- **Web Audio API** para todos los sonidos.

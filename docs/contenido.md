# Guía de contenido

Todo lo que se lee en el portfolio sale de [`src/data/portfolio.js`](../src/data/portfolio.js).
Los tres modos (Classic, Cinematic y Game) leen el mismo archivo, así que **un cambio ahí se ve en los tres**.

> Los comentarios `// TODO` del archivo marcan textos provisionales que conviene sustituir.

---

## `profile`: datos principales

| Campo | Para qué sirve | Dónde se ve |
|---|---|---|
| `name` | Nombre completo. | Cabeceras, título grande, pantalla de selección (se usa la primera palabra), pantalla de arranque. |
| `role` | Puesto (`Game QA Tester`). | Hero, tarjeta "Class", pantalla de inicio del juego. |
| `tagline` | Frase corta bajo el nombre. | Hero (Classic y Cinematic). |
| `location` | Ubicación. | Tarjeta de perfil. |
| `available` | `true` muestra la insignia **Open to work**. | Hero del Classic. |
| `currentJob` | `{ company, url }` de tu trabajo actual. `null` para ocultarlo. | Insignia "Currently working at…", tarjeta "Current guild". |
| `cvUrl` | Ruta del CV (`cv.pdf`). | Botones "Download CV" / "CV". |
| `about` | Lista de párrafos del "About me". | Sección About (en Cinematic las palabras se iluminan al hacer scroll). |
| `stats` | `{ value, label }`: cifras destacadas. | Hero. En Cinematic los números cuentan hacia arriba si empiezan por dígitos (`'1000+'` → cuenta hasta 1000 y añade `+`). |

**CV:** coloca el archivo en `public/cv.pdf`. Si todavía no existe, el botón descargará un error 404.

---

## `avatar`: el personaje pixel

```js
export const avatar = {
  hair: '#b3940e',
  skin: '#f2c29b',
  shirt: '#e3e3e3',
  headset: '#0f51ea',
  lines: ['Hi! Welcome to my portfolio.', …],
}
```

- Los cuatro colores se aplican al avatar de **todos** los modos (hero, pantalla de selección, Cinematic y el personaje del juego).
- `lines` son las frases del bocadillo; cambian al hacer clic en el avatar del Classic.
- **La forma** del avatar (pelo, cara…) está dibujada en `SPRITE` dentro de
  [`src/components/Avatar.jsx`](../src/components/Avatar.jsx): 20 filas de 16 caracteres, un carácter por píxel
  (`O` contorno, `H` pelo, `S` piel, `W`/`E` ojos, `M` boca, `P` cascos, `T` camiseta, `C` mando, `.` transparente).
  Cada fila debe tener exactamente 16 caracteres.

---

## `journey`: trayectoria (trabajo y estudios)

Cada elemento es un "nivel" del mapa, en orden cronológico:

```js
{
  level: '1-3',              // número de nivel que se muestra en el mapa
  type: 'study',             // 'study' o 'work' (cambia color e icono)
  title: 'Advanced Technician in…',
  place: 'Salesianos Zaragoza…',
  period: '2025 – Present',
  description: '…',          // si empieza por "TODO" no se muestra en Cinematic ni en Game
  current: true,             // opcional: marca "▶ In progress"
}
```

Al final se añade solo un nivel bloqueado ("Next level / Your studio?") que invita a contactar.

| Modo | Cómo se ve |
|---|---|
| Classic | Mapa estilo *Super Mario World* por el que camina el avatar + lista de tarjetas. |
| Cinematic | Carretera horizontal que avanza con el scroll. |
| Game | Una bandera por nivel; se iza al abrirla. |

---

## `bugReport` y `bugReportTips`: ejemplo de bug report

Un informe **ficticio** (los reales están bajo NDA) que enseña el formato de trabajo:
`id`, `title`, `build`, `platform`, `area`, `severity` (`Critical` / `Major` / `Minor` / `Trivial`, cada uno con su color),
`priority`, `reproducibility`, `preconditions`, `steps`, `expected`, `actual`, `notes` y `attachments`.

`bugReportTips` es la lista "What makes it useful" que acompaña al informe.

---

## `qaResponsibilities`: tareas generales de QA

Lista de lo que haces en todos los proyectos. Se muestra encima de las tarjetas de juegos (Classic),
antes del primer juego (Cinematic) y en el listado de la arcade (Game).

---

## `games`: juegos testeados

Ordenados del más nuevo al más antiguo:

```js
{
  title: 'HYPERWIRED',
  studio: 'SIDRALGAMES / Entalto Publishing',
  year: '2026',                       // texto libre: '2025', 'In development'…
  platforms: ['PC', 'PS5', 'Switch'],
  genre: 'Roguelike shooter',
  role: 'QA Tester',
  image: 'images/games/hyperwired.jpg', // null → se genera un placeholder con las iniciales
  tasks: [],                          // opcional: tareas concretas en ese juego
  tools: [],                          // opcional: herramientas usadas (Jira, Trello…)
  link: 'https://store.steampowered.com/app/…',
}
```

- **Imagen**: guárdala en `public/images/games/` con la ruta sin `public/`. Lo ideal es la cabecera de Steam (460×215).
- El número de juegos se calcula solo: "15 games tested", el número de máquinas arcade, la barra de progreso de Cinematic…
- En **Game**, cada juego es una máquina arcade con su portada pixelada en la pantalla.

---

## `skills`: habilidades

Grupos con su lista de elementos:

```js
{ group: 'Tools', items: ['Jira', 'TestRail', 'Mantis', …] }
```

En **Game**, cada grupo es un bloque **?**; cada golpe desde abajo suelta una skill. Solo se usa la primera palabra
del grupo como etiqueta del bloque (`Development (DAM)` → `DEVELOPMENT`).

---

## `devProjects`: proyectos de programación

```js
{
  title: 'DAM Project',
  description: '…',
  stack: ['Java', 'SQL'],
  repo: null,   // URL de GitHub → aparece "Code →"
  demo: null,   // URL de demo → aparece "Demo →"
}
```

---

## `renders`: galería de Blender

```js
{ title: 'Render one', image: 'images/blender/render-1.jpg' } // image: null → placeholder
```

En Classic, al hacer clic en un render con imagen se abre a pantalla completa (Esc para cerrar).

---

## `links`: contacto

`email`, `linkedin` y `github`. Se usan en la sección de contacto de los tres modos y en el nivel bloqueado.

---

## Textos que no están en `portfolio.js`

Algunas frases forman parte del diseño de cada modo y están en su componente:

| Texto | Archivo |
|---|---|
| Nombre, duración y descripción de cada modo (pantalla SELECT MODE) | `VARIANTS` en [`src/Root.jsx`](../src/Root.jsx) |
| Títulos de sección ("QUEST LOG", "Games I've tested"…) del Classic | Cada componente en [`src/components/`](../src/components/) |
| Títulos y capítulos del Cinematic | [`src/variants/scroll/ScrollPortfolio.jsx`](../src/variants/scroll/ScrollPortfolio.jsx) |
| Carteles, etiquetas y orden del nivel del juego | [`src/variants/game/level.js`](../src/variants/game/level.js) |
| Logros (toasts) | `BUG_MILESTONES` en [`App.jsx`](../src/App.jsx) y en [`GamePortfolio.jsx`](../src/variants/game/GamePortfolio.jsx) |
| Líneas de la pantalla de arranque | [`src/components/BootScreen.jsx`](../src/components/BootScreen.jsx) |

---

## Colores y fuentes

En [`src/styles/theme.css`](../src/styles/theme.css):

| Variable | Uso |
|---|---|
| `--bg`, `--bg-alt`, `--surface` | Fondos de página, ventanas y paneles. |
| `--text`, `--text-muted` | Texto principal y secundario. |
| `--accent` (amarillo), `--accent-2` (cian), `--accent-3` (naranja) | Destacados, botones, etiquetas. |
| `--font-display` | *Press Start 2P*: títulos. |
| `--font-body` | *VT323*: texto. |
| `--border-w`, `--shadow` | Grosor de bordes y sombra pixel. |

El modo Game dibuja en canvas y usa su propia paleta (`PAL` en [`level.js`](../src/variants/game/level.js)),
con los mismos colores *Sweetie 16*.

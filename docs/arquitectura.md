# Arquitectura

## Flujo de arranque

```
index.html
  └─ src/main.jsx          monta React y carga theme.css, global.css y switcher.css
       └─ src/Root.jsx     decide qué mostrar
            ├─ ModeSelect           (primera visita o ?select)
            └─ modo elegido + PortfolioSwitcher (barra MODE)
                 ├─ App.jsx                                 Classic
                 ├─ variants/scroll/ScrollPortfolio.jsx     Cinematic
                 └─ variants/game/GamePortfolio.jsx         Game
```

`Root` solo monta **un** modo a la vez. Al cambiar, el anterior se desmonta y limpia sus bucles de animación,
listeners y el modo debug, así que ningún modo sigue funcionando en segundo plano.

La lista de modos está en `VARIANTS` ([`Root.jsx`](../src/Root.jsx)): la usan tanto la pantalla de selección como la barra.

---

## Árbol de archivos

```
src/
├── main.jsx
├── Root.jsx                    selección de modo, URL (?v=, ?select) y memoria
├── App.jsx                     modo Classic: secciones, logros, Konami, sonido de clic
├── data/
│   └── portfolio.js            contenido (ver docs/contenido.md)
├── components/                 ── modo Classic ──
│   ├── BootScreen.jsx          pantalla de arranque tipo terminal
│   ├── BackgroundBugs.jsx      bichos del fondo (canvas a pantalla completa)
│   ├── Navbar.jsx
│   ├── Hero.jsx
│   ├── Avatar.jsx              sprite del avatar (exporta SPRITE y EYES_ROW)
│   ├── BugInvaders.jsx         minijuego (canvas 320×240)
│   ├── About.jsx
│   ├── Journey.jsx, JourneyMap.jsx   mapa SVG + tarjetas
│   ├── QAProjects.jsx
│   ├── BugReport.jsx
│   ├── Skills.jsx
│   ├── DevProjects.jsx
│   ├── Gallery3D.jsx
│   ├── Contact.jsx, Footer.jsx
│   ├── SectionTitle.jsx, Placeholder.jsx, Toast.jsx
│   │                           ── comunes ──
│   ├── ModeSelect.jsx          pantalla SELECT MODE
│   └── PortfolioSwitcher.jsx   barra MODE
├── variants/
│   ├── shared.jsx              PixelAvatar, AVATAR_COLORS, avatarRows, SoundToggle
│   ├── scroll/
│   │   ├── Scene.jsx           motor de escenas: Scene, Reveal, useScrollTicker
│   │   └── ScrollPortfolio.jsx capítulos del modo Cinematic
│   └── game/
│       ├── level.js            diseño del nivel, zonas y paleta
│       ├── engine.js           física, colisiones, enemigos y dibujo en canvas
│       ├── GamePortfolio.jsx   React: pantalla de inicio, HUD, menú, controles táctiles
│       └── GamePanel.jsx       ventanas con el contenido de cada sección
├── sound.js                    efectos de sonido
├── sprites.js                  sprites de bichos/nave + drawSprite()
├── assets/                     cursores pixel (SVG)
└── styles/
    ├── theme.css               variables de color, fuentes, bordes
    ├── global.css              base + todo el modo Classic
    ├── switcher.css            barra MODE + pantalla SELECT MODE
    ├── scroll.css              modo Cinematic (clases cine-*)
    └── game.css                modo Game (clases game-*)
```

Cada modo usa su propio prefijo de clases CSS (`cine-`, `game-`, `mode-`, `switcher`) para no pisar los
estilos del Classic. Los tres reutilizan las piezas base de `global.css` (`.btn`, `.panel`, `.tag`, `.window`…).

---

## Motor del modo Cinematic

Archivo: [`src/variants/scroll/Scene.jsx`](../src/variants/scroll/Scene.jsx).

### Idea

1. Cada `<Scene>` es una sección **alta** (`length` × altura de pantalla) con un hijo `position: sticky` que ocupa
   la pantalla. Mientras haces scroll dentro de la sección, el contenido se queda fijo.
2. En cada frame de scroll se calcula el **progreso** de la escena, de 0 a 1, y se escribe en la variable CSS `--p`.
3. **El CSS convierte `--p` en movimiento** con `calc()` y `clamp()`. No hay librería de animación.

```css
/* ejemplo: aparecer entre el 20 % y el 28 % de la escena */
.r {
  --t: clamp(0, (var(--p) - var(--at)) / var(--len), 1);
  opacity: var(--t);
  transform: translateY(calc((1 - var(--t)) * 48px));
}
```

### Piezas

| Pieza | Uso |
|---|---|
| `useScrollTicker(fn)` | Ejecuta `fn` como mucho una vez por frame tras un scroll o resize (un solo listener compartido). |
| `<Scene id label length title tag onProgress>` | Escena fija. `onProgress(p)` sirve cuando hace falta lógica en JS (p. ej. qué juego se muestra). |
| `<Reveal at len out from>` | Hace aparecer un elemento cuando `--p` llega a `at`. `from`: `up`, `left`, `right`, `zoom`, `flip`, `stamp`. `out` lo vuelve a ocultar. |
| `.cine-pan-y` / `.cine-pan-x` | Si el contenido no cabe en pantalla, se desplaza solo durante la escena (la escena mide cuánto sobra y lo guarda en `--ov-y` / `--ov-x`). |

### Añadir un capítulo

```jsx
<Scene id="cine-nuevo" label="Nuevo" length={2.5} tag="// 08 NUEVO" title="Mi sección">
  <div className="cine-body">
    <div className="cine-pan-y">
      <Reveal at={0.15}>Aparece al 15 %</Reveal>
      <Reveal at={0.4} from="left">Entra desde la izquierda al 40 %</Reveal>
    </div>
  </div>
</Scene>
```

Y añadir `{ id: 'cine-nuevo', label: 'Nuevo' }` a `CHAPTERS` en `ScrollPortfolio.jsx` para que salga en la cabecera y en los puntos laterales.

---

## Motor del modo Game

### Separación React / motor

- **`engine.js`** no usa React. `createGame(canvas, callbacks)` arranca un bucle `requestAnimationFrame` y devuelve una API:
  `press(acción, pulsada)`, `setPaused(bool)`, `warp(panel)`, `progress()`, `zones()` y `destroy()`.
- **`GamePortfolio.jsx`** traduce teclado y botones táctiles a `press()`, pausa el motor cuando hay una ventana abierta
  y recibe eventos del motor por `callbacks`: `onOpen`, `onBug`, `onSkill`, `onGoal`, `onNear`.
- React solo se re-renderiza para el HUD y las ventanas, no en cada frame.

### Unidades y cámara

- 1 unidad = 1 píxel del sprite del avatar (16×20). `y = 0` es el suelo; hacia arriba es negativo.
- La escala (píxeles de pantalla por unidad) se ajusta al tamaño de la ventana y es siempre un número entero
  para que el pixel art se vea nítido. En pantallas táctiles el suelo sube para dejar sitio a los botones.
- La cámara sigue al jugador con algo de adelanto hacia donde mira.

### Física

Constantes al principio de `engine.js`: `GRAVITY`, `JUMP_SPEED`, `RUN_SPEED`, `ACCEL`, `MAX_FALL`.
Incluye *coyote time* (poder saltar justo después de dejar el borde), *buffer* de salto y salto más corto si se suelta
el botón antes. Las colisiones son rectángulos (AABB), resueltas primero en horizontal y después en vertical.
Golpear un bloque **?** desde abajo llama a `hitBlock()`.

### Diseño del nivel

[`level.js`](../src/variants/game/level.js) → `buildLevel()` coloca los objetos de izquierda a derecha con un cursor `x`,
así que añadir juegos, niveles o grupos de skills alarga el nivel automáticamente.

| Tipo de objeto | Campos clave | Se dibuja en |
|---|---|---|
| `sign` | `lines`, `panel` (opcional) | `drawSign` |
| `house`, `terminal`, `workshop`, `castle` | `label`, `panel` | `drawHouse`, … |
| `flag` | `level`, `kind` (`work`/`study`/`locked`), `panel` | `drawFlag` |
| `cabinet` | `index` (juego), `color` | `drawCabinet` |
| `pole` | mástil final | `drawPole` |
| bloques (`blocks`) | `group`, `items` | `drawBlock` |
| enemigos (`bugs`) | `from`, `to` (zona de patrulla), `big` | `drawBugs` |

`panel` indica qué ventana se abre: `about`, `journey:0`, `locked`, `report`, `game:3`, `games`, `skills`, `dev`, `contact`.
El contenido de cada ventana está en [`GamePanel.jsx`](../src/variants/game/GamePanel.jsx).

**Añadir un objeto nuevo:** meterlo en `objects` dentro de `buildLevel()`, escribir su función `drawX()` en `engine.js`,
registrarla en el objeto `DRAW` y, si abre una ventana nueva, añadir el caso en `GamePanel.jsx` y la zona en `ZONES`.

---

## Classic: piezas destacadas

- **`BackgroundBugs`**: canvas fijo detrás de la página. Los bichos huyen del ratón y se esconden detrás de los
  elementos sólidos (lista `OPAQUE`).
- **`BugInvaders`**: canvas de 320×240 que el CSS escala (`image-rendering: pixelated`). Estados:
  `idle`, `playing`, `paused`, `over`, `won`. Usa `IntersectionObserver` y `visibilitychange` para pausarse solo.
- **`JourneyMap`**: SVG a 320×120 con sprites definidos como texto (un carácter por píxel).
- **Debug mode**: añade la clase `debug` a `<html>`; el CSS dibuja los contornos y `BugInvaders` lee la clase para el triple disparo.

---

## Sonido

[`src/sound.js`](../src/sound.js) genera los efectos con la **Web Audio API** (osciladores de onda cuadrada/sierra
y ruido blanco). No hay archivos de audio.

- `sfx.blip`, `select`, `shoot`, `explode`, `hurt`, `wave`, `gameOver`, `powerUp`: interfaz y Bug Invaders.
- `sfx.jump`, `stomp`, `bossHit`: modo Game.
- `setSoundOn(bool)` / `isSoundOn()` / `onSoundChange(fn)`: estado global del sonido, compartido por todos los botones ♪.

Para crear un sonido: `tone({ freq, to, dur, type, vol, delay })` hace una nota (con deslizamiento opcional hasta `to`)
y `noise({ dur, vol })` hace un golpe de ruido.

---

## Datos guardados en el navegador

| Clave | Almacén | Para qué |
|---|---|---|
| `portfolio-variant` | localStorage | Último modo elegido. |
| `sfx` | localStorage | Sonido `on` / `off`. |
| `bug-invaders-hi` | localStorage | Récord de Bug Invaders. |
| `booted` | sessionStorage | La pantalla de arranque ya se vio en esta sesión. |
| `bug-hint` | sessionStorage | El aviso "Bugs detected!" ya se mostró. |

Todos los accesos están dentro de `try/catch`: si el navegador bloquea el almacenamiento (modo privado estricto),
la web funciona igual, solo que no recuerda nada.

---

## Accesibilidad y rendimiento

- `prefers-reduced-motion`: una regla global de `global.css` desactiva las animaciones y transiciones CSS en toda la web,
  y el Classic no muestra la pantalla de arranque ni el aviso de los bichos. (Las escenas del Cinematic siguen
  respondiendo al scroll, porque las mueve el propio usuario.)
- Navegación con teclado en todos los modos (selección de modo, mapa, minijuegos, ventanas del juego con `Esc`).
- Botones con `aria-label`, ventanas con `role="dialog"` y `aria-modal`, contadores con `aria-live`.
- Los bucles de canvas se detienen al desmontar el componente; Bug Invaders solo actualiza y dibuja cuando está en pantalla.
- Las imágenes de la galería y de los juegos usan `loading="lazy"`.

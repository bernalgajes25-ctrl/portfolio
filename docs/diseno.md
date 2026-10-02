# Diseño

Guía de estilo del portfolio: qué decisiones visuales se han tomado, dónde están en el código y ejemplos de cómo
usar cada pieza.

## Concepto

El portfolio es de una **tester de videojuegos**, así que toda la web se presenta como un videojuego retro:

- Las secciones tienen nombre de menú de juego: *Player profile*, *World map*, *Quest log*, *Save file*,
  *Skill tree*, *Side quests*, *Bonus level*, *Multiplayer*.
- La trayectoria son **niveles** (1-1, 1-2…) y el siguiente empleo es un nivel bloqueado.
- Los bichos (*bugs*) aparecen por todas partes y se pueden "arreglar".
- El bug report se muestra como una ventana de un sistema operativo antiguo.

## Principios

| Principio | Cómo se aplica |
|---|---|
| **Todo es un píxel** | Sin esquinas redondeadas (no hay ningún `border-radius` en el CSS). Bordes gruesos, sombras duras sin desenfoque, sprites dibujados píxel a píxel. |
| **Paleta cerrada** | La interfaz usa los colores de *Sweetie 16* a través de variables CSS. Las excepciones están contadas (ver [Color](#color)). |
| **Movimiento por pasos** | Las animaciones saltan entre fotogramas en vez de deslizarse (ver [animaciones.md](animaciones.md)). |
| **Un solo contenido, tres formas** | Los tres modos leen los mismos datos y comparten las mismas piezas visuales. |
| **El juego no estorba** | Siempre hay un camino rápido: modo Classic, "Skip to menu" y menú rápido en Game, enlaces directos con `?v=`. |

---

## Color

Paleta [*Sweetie 16*](https://lospec.com/palette-list/sweetie-16) (16 colores), definida como variables CSS en
[theme.css](../src/styles/theme.css).

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#1a1c2c` | Fondo de la página. |
| `--bg-alt` | `#20223a` | Fondo de ventanas, etiquetas y del minijuego. |
| `--surface` | `#29366f` | Paneles, tarjetas y botones. |
| `--surface-hover` | `#3b5dc9` | Barra de título de las ventanas. |
| `--border`, `--outline` | `#0d0e18` | Bordes y sombras. |
| `--text` | `#f4f4f4` | Texto principal. |
| `--text-muted` | `#94b0c2` | Texto secundario. |
| `--accent` | `#ffcd75` (amarillo) | Acción principal, títulos de panel, elemento seleccionado. |
| `--accent-ink` | `#1a1c2c` | Texto colocado **encima** del amarillo. |
| `--accent-2` | `#73eff7` (cian) | Enlaces, etiquetas destacadas, hover. |
| `--accent-3` | `#ef7d57` (naranja) | Lugar/empresa, severidad *Major*. |
| `--green` | `#a7f070` | Correcto, disponible, "FIXED!". |
| `--red` | `#b13e53` | Error, severidad *Critical*, cerrar. |
| `--purple` | `#5d275d` | Definida pero sin uso en el CSS por ahora (el morado sí aparece en el mapa y en el modo Game). |

**Colores que no son de Sweetie 16:**

- `--bg-alt` (`#20223a`) y `--border` / `--outline` (`#0d0e18`), dos tonos añadidos para fondos y contornos.
- Los cuatro colores del avatar (`hair`, `skin`, `shirt`, `headset`), que se eligen en
  [portfolio.js](../src/data/portfolio.js).
- Cuatro tonos sueltos del modo Game (cráteres de la luna, sombra de las montañas, tejas y brillo del bloque **?**).
- Las capas semitransparentes (`rgba(…)`) de los fondos de ventanas, cabeceras y portadas.

**Cómo se usa cada color.** El amarillo marca lo principal o lo seleccionado (botón primario, tarjeta de modo
elegida, nivel seleccionado), el cian los enlaces y las etiquetas destacadas, el verde lo correcto y el rojo el
error. Por ejemplo, en el bug report: *Expected* lleva borde verde y *Actual* borde rojo.

**Severidad de un bug** (clases `.sev--*`):

| Clase | Color |
|---|---|
| `.sev--critical` | Rojo, texto claro |
| `.sev--major` | Naranja |
| `.sev--minor` | Amarillo |
| `.sev--trivial` | Gris azulado |

**En canvas y SVG.** Bug Invaders y los bichos de fondo leen los colores de las variables CSS con
`getComputedStyle`. El modo Game y el mapa de la trayectoria repiten la paleta en sus propios objetos:
`PAL` en [level.js](../src/variants/game/level.js) y `C` en [JourneyMap.jsx](../src/components/JourneyMap.jsx).
Si se cambia un color en `theme.css`, hay que cambiarlo también ahí.

---

## Tipografía

| Variable | Fuente | Uso |
|---|---|---|
| `--font-display` | **Press Start 2P** | Títulos (`h1`–`h4`, en mayúsculas), números de nivel, contadores. |
| `--font-body` | **VT323** | Todo el texto de lectura, botones y etiquetas. |

Press Start 2P solo se usa en títulos y rótulos cortos, casi siempre a tamaños pequeños (entre `0.55rem` y
`1.1rem`; solo los títulos grandes pasan de ahí). El texto de lectura va en VT323 con un tamaño base grande (`1.4rem`).

| Variable | Valor | Uso |
|---|---|---|
| `--body-size` | `1.4rem` | Texto base. |
| `--body-line` | `1.3` | Interlineado. |
| `--h1-size` | `clamp(1.5rem, 5vw, 2.6rem)` | Nombre en el hero. |
| `--h2-size` | `clamp(1.05rem, 3vw, 1.6rem)` | Título de sección. |
| `--h3-size` | `0.8rem` | Título de tarjeta o panel. |

Los títulos usan `clamp(mínimo, fluido, máximo)`: crecen con el ancho de la pantalla pero nunca se salen de esos
límites, sin necesidad de *media queries*.

---

## Bordes, sombras y profundidad

| Variable | Valor | Uso |
|---|---|---|
| `--border-w` | `4px` | Grosor de borde estándar. |
| `--shadow` | `6px 6px 0 var(--outline)` | Sombra dura, sin desenfoque. |
| `--shadow-hover` | `8px 8px 0 var(--accent-2)` | Sombra al pasar el ratón: más larga y cian. |
| `--lift` | `translate(-2px, -2px)` | Desplazamiento al pasar el ratón. |

La sombra no tiene desenfoque (el tercer valor es `0`), así que parece un bloque sólido detrás del elemento.
Al pasar el ratón, el elemento se mueve arriba a la izquierda y la sombra crece: da la sensación de que se
**levanta**. Al pulsar un botón ocurre lo contrario y se **hunde** (extracto de `global.css`):

```css
.btn:hover  { transform: var(--lift);          box-shadow: var(--shadow-hover); }
.btn:active { transform: translate(4px, 4px);  box-shadow: 2px 2px 0 var(--outline); }
```

Otros detalles de la misma estética:

- **Fondo**: una trama de puntos de 1 px cada 8 px sobre `--bg`.
- **Cursor**: dos cursores pixel propios (flecha y mano) en [src/assets/](../src/assets/).
- **Selección de texto**: fondo amarillo.
- **Foco de teclado**: contorno amarillo de 3 px (`:focus-visible`). Las tarjetas de SELECT MODE lo sustituyen por su estado seleccionado y la pantalla de Bug Invaders no lo muestra.

---

## Componentes base

Están en [global.css](../src/styles/global.css) y los reutilizan los tres modos.

### Botones

```html
<a class="btn btn--primary" href="#qa">View projects</a>
<a class="btn" href="#contact">Contact me</a>
<a class="btn btn--ghost" href="cv.pdf" download>Download CV</a>
```

| Clase | Aspecto | Cuándo |
|---|---|---|
| `.btn--primary` | Amarillo | La acción principal. En el proyecto hay **una por grupo** de botones. |
| `.btn` | Azul | Acciones secundarias. |
| `.btn--ghost` | Sin fondo, subrayado | Acciones de menor peso. |

### Etiquetas

```html
<ul class="tags">
  <li class="tag tag--accent">PC</li>
  <li class="tag">Jira</li>
</ul>
```

`.tag--accent` (cian) para las plataformas de cada juego y, en el modo Cinematic, también para skills y tecnologías.
`.tag` (gris) para herramientas, adjuntos y, en el Classic, skills y tecnologías.

### Panel

```html
<div class="panel">
  <h3 class="panel__title">What I do on every project</h3>
  …
</div>
```

Caja azul con borde y sombra. Es el contenedor genérico.

### Ventana

```html
<article class="window">
  <header class="window__bar">
    <span>BUG-0427.txt</span>
    <span class="window__buttons" aria-hidden="true"><i></i><i></i><i></i></span>
  </header>
  <div class="window__body">…</div>
</article>
```

Imita una ventana de sistema operativo antiguo. Se usa para el bug report y para todas las ventanas del modo Game.

### Tarjeta de juego

```html
<article class="card">
  <div class="card__media">
    <img src="images/games/hyperwired.jpg" alt="HYPERWIRED cover" loading="lazy" />
    <span class="card__year">2026</span>
  </div>
  <div class="card__body">
    <h3>HYPERWIRED</h3>
    <p class="card__meta">SIDRALGAMES / Entalto Publishing · Roguelike shooter</p>
    <ul class="tags">…</ul>
    <a class="card__link" href="…">View game →</a>
  </div>
</article>
```

La imagen usa la proporción `460 / 215`, la de las cabeceras de Steam, con `object-fit: cover`.
Si un juego no tiene imagen, [`Placeholder`](../src/components/Placeholder.jsx) genera un fondo a rayas con sus iniciales (hasta tres letras).

### Otros

| Pieza | Clase | Uso |
|---|---|---|
| Insignia | `.badge` + `.dot` | "Currently working at…" y "Open to work", con el punto verde parpadeando. |
| Título de sección | `.section-title` | Etiqueta amarilla (`// 03 QUEST LOG`) + `h2`. |
| Aviso de logro | `.toast` | Abajo a la derecha, con icono. |
| Bocadillo | `.avatar__bubble` | Lo que "dice" el avatar. |

### Nombres de clases

Se sigue la convención **BEM**: `bloque__elemento--variante` (`card__media`, `btn--primary`) y los estados con
`is-` (`is-selected`, `is-active`, `is-locked`). Cada modo tiene su prefijo para no pisar a los demás:
`cine-` (Cinematic), `game-` (Game), `mode-` y `switcher` (selección de modo).

---

## Pixel art

Los sprites no son imágenes: son **texto**, con un carácter por píxel. Así se editan en el propio código y el color
se decide al pintarlos. Por ejemplo, el arbusto del mapa (`BUSH` en `JourneyMap.jsx`):

```js
const BUSH = ['.GGG.', 'GGgGG', 'GGGGG']
// "." = transparente, G = verde oscuro, g = verde claro
```

En [sprites.js](../src/sprites.js) el formato es aún más simple: `#` es un píxel relleno, un espacio es transparente
y el color se pasa a `drawSprite()`.

| Sprite | Tamaño | Archivo | Se pinta con |
|---|---|---|---|
| Avatar | 16 × 20 | [Avatar.jsx](../src/components/Avatar.jsx) | SVG (un `<rect>` por píxel) y canvas en el modo Game. |
| Bichos (4 tipos, 2 fotogramas) | 11 × 8, 8 × 8 y 12 × 8 | [sprites.js](../src/sprites.js) | Canvas. |
| Nave | 11 × 6 | sprites.js | Canvas. |
| Mapa (árboles, castillo, escuela…) | varios | [JourneyMap.jsx](../src/components/JourneyMap.jsx) | SVG. |

El avatar es **el mismo personaje en los tres modos** y sus colores (pelo, piel, camiseta, cascos) salen de
`avatar` en [portfolio.js](../src/data/portfolio.js). En el mapa de la trayectoria se usa una versión reducida
(8 × 10) con esos mismos colores.

Reglas para que se vea nítido a cualquier tamaño:

- **SVG**: `shapeRendering="crispEdges"` y un `viewBox` pequeño (por ejemplo `0 0 16 20`) que el CSS escala.
- **Canvas**: resolución interna baja (Bug Invaders es de 320 × 240) escalada con `image-rendering: pixelated`.
- **Modo Game**: la escala (`state.scale`) es siempre un número entero y el suavizado de imagen está desactivado.

---

## Diseño adaptable

| Decisión | Detalle |
|---|---|
| Margen lateral | `.container` usa `padding-inline: max(16px, 5vw)`: un 5 % del ancho, nunca menos de 16 px. |
| Rejillas | `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`: las columnas aparecen y desaparecen solas según el ancho, sin *media queries*. |
| Altura de pantalla | `100svh` en vez de `100vh`, para que en el móvil no salte al ocultarse la barra del navegador. |
| Táctil | `@media (pointer: coarse)` muestra los botones del modo Game y oculta las ayudas de teclado. |

Puntos de corte principales:

| Ancho | Qué cambia |
|---|---|
| ≤ 1060 px | La barra de navegación pasa a menú hamburguesa. |
| ≥ 980 px | El hero se divide en dos columnas (texto + minijuego). |
| ≥ 860 px | La trayectoria pasa a zigzag (tarjetas a izquierda y derecha). |
| ≤ 860 px | Las tarjetas de SELECT MODE se apilan. |
| ≤ 640 px | El mapa de la trayectoria se dibuja en vertical (160 × 260 en vez de 320 × 120). |

El mapa no se limita a encogerse: en el móvil **se vuelve a generar** en vertical, para que quepa en el ancho de la
pantalla sin recortarse.

---

## Accesibilidad

- **Contraste**: texto claro sobre fondo muy oscuro, y sobre el amarillo se usa `--accent-ink`.
- **Teclado**: la selección de modo, el mapa de la trayectoria, Bug Invaders, el visor de la galería (`Esc`) y el
  modo Game se manejan con teclado. La excepción son los bichos de fondo del Classic, que solo se aplastan con clic o toque.
- **Lectores de pantalla**: `aria-label` en los botones con icono, `role="dialog"` en las ventanas, `aria-live` en
  contadores y avisos, y `aria-hidden` en lo puramente decorativo (sprites, estrellas).
- **Movimiento**: se respeta `prefers-reduced-motion` (ver [animaciones.md](animaciones.md#accesibilidad-prefers-reduced-motion)).
- **Sonido**: apagado por defecto; se activa con el botón ♪.

---

## Ejemplo: añadir una sección nueva al Classic

Una sección "Certificaciones" usando solo piezas que ya existen. **Es un ejemplo inventado**: esta sección y su
contenido no están en el proyecto.

```jsx
import SectionTitle from './SectionTitle.jsx'

export default function Certifications() {
  return (
    <section className="section" id="certs">
      <div className="container">
        <SectionTitle index={9} label="ACHIEVEMENTS" title="Certifications" />
        <div className="grid grid--cards">
          <div className="panel">
            <h3 className="panel__title">Nombre de la certificación</h3>
            <p>Año</p>
            <ul className="tags">
              <li className="tag tag--accent">Testing</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
```

Lista de comprobación para que encaje con el resto:

- [ ] Colores solo con variables de `theme.css`.
- [ ] Bordes con `--border-w` y sombra con `--shadow`; nada de `border-radius`.
- [ ] Título con `--font-display`, texto con `--font-body`.
- [ ] Un único `.btn--primary` por grupo de acciones.
- [ ] Animaciones con `steps()`.
- [ ] El texto sale de `portfolio.js`, no del componente.
- [ ] Se puede usar con teclado y el foco se ve.

# Animaciones

Todo el movimiento del portfolio está programado a mano: no hay ninguna librería de animación.
Se usan **cuatro técnicas**, cada una para un tipo de movimiento distinto:

| Técnica | Quién marca el ritmo | Dónde se usa |
|---|---|---|
| [CSS por pasos](#1-css-por-pasos-keyframes-y-transiciones) (`@keyframes` + `steps()`) | El reloj del navegador | Bucles decorativos y respuestas a hover/clic en los tres modos. |
| [CSS guiado por scroll](#2-css-guiado-por-scroll-modo-cinematic) (variable `--p`) | El scroll del usuario | Todas las escenas del modo Cinematic. |
| [Canvas 2D](#3-canvas-2d-bucles-con-requestanimationframe) (`requestAnimationFrame`) | Un bucle con *delta time* | Bichos de fondo, Bug Invaders y el modo Game. |
| [Estado de React](#4-animaciones-con-estado-de-react) (temporizadores y `requestAnimationFrame`) | JavaScript | Parpadeo del avatar, pantalla de arranque, mapa de la trayectoria. |

---

## 1. CSS por pasos: keyframes y transiciones

### Por qué `steps()`

Una animación normal interpola de forma suave entre el inicio y el final. Con `steps(n)` el navegador solo
pinta `n` posiciones intermedias, así que el elemento **salta** de una a otra como los fotogramas de un sprite.
Es lo que hace que el movimiento encaje con el pixel art.

```css
.avatar__sprite {
  animation: bob 1.2s steps(2) infinite; /* dos posiciones: abajo y arriba */
}

@keyframes bob {
  50% {
    transform: translateY(-4px);
  }
}
```

Los `@keyframes` solo declaran el punto intermedio o el inicial (`50%` o `from`): el otro extremo es el estilo
normal del elemento, así que no hay que repetirlo.

### Catálogo de `@keyframes`

| Nombre | Archivo | Qué hace | Dónde se ve |
|---|---|---|---|
| `blink` | [global.css](../src/styles/global.css) | Opacidad 1 → 0 → 1 de golpe (`steps(1)`). | Cursor `_` del logo, nivel actual del mapa, "▶ In progress", "Press start" de la tarjeta de modo seleccionada. |
| `pulse` | global.css | Baja la opacidad a 0.2 en dos pasos. | Punto verde de las insignias del hero ("Currently working at…", "Open to work"), texto de la pantalla de inicio del juego, "★ Level complete ★" en la ventana de contacto (4 repeticiones). |
| `bob` | global.css | Sube 4 px y vuelve. | Avatar (todos los modos), nodo del nivel actual, flecha "Scroll to start", avatar caminando en Journey (0.4 s), letras de "LEVEL COMPLETE". |
| `toast-in` | global.css | Entra desde abajo en 3 pasos. | Avisos de logros. |
| `switcher-glow` | [switcher.css](../src/styles/switcher.css) | Borde y sombra alternan a cian. | Barra MODE mientras se muestra el aviso "Switch mode anytime here!". |
| `switcher-in` | switcher.css | Sube 12 px y aparece. | Bocadillo "Switch mode anytime here!". |
| `mp-scroll` | switcher.css | Tres "pantallas" que suben con pausas (24 pasos). | Vista previa de Cinematic en SELECT MODE. |
| `mp-jump` | switcher.css | Salto de 40 px en 6 pasos. | Vista previa de Game (avatar bajo el bloque **?**). |
| `mp-walk` | switcher.css | Va y vuelve 40 px (`alternate`). | Bicho de la vista previa de Game. |
| `game-pop` | [game.css](../src/styles/game.css) | Escala 0.8 → 1 y aparece en 4 pasos. | Ventanas del modo Game. |
| `cine-rise` | [scroll.css](../src/styles/scroll.css) | Sube 40 px y aparece en 5 pasos. | Datos de cada juego en Cinematic, escalonados 0.1 s entre sí. |
| `cine-kenburns` | scroll.css | Zoom lento de 1.18 a 1 en 9 s. | Portada del juego activo en Cinematic. |

Las vistas previas `mp-scroll` y `mp-jump` solo se animan en la tarjeta **seleccionada** (`.mode-card.is-selected`),
para que la mirada vaya a una sola tarjeta.

**Desfase entre elementos.** Las letras de "LEVEL COMPLETE" comparten la misma animación `bob`, pero cada una
empieza en un punto distinto con un retardo negativo calculado a partir de su índice:

```css
.cine-contact__title span {
  animation: bob 1s steps(2) infinite;
  animation-delay: calc(var(--i) * -0.13s); /* --i lo pone React en cada letra */
}
```

### Transiciones

| Elemento | Transición | Efecto |
|---|---|---|
| `.btn`, `.card`, `.gallery__item` | `transform` y `box-shadow`, 0.1 s `steps(2)` | Al pasar el ratón se levantan 2 px y la sombra pasa a cian; al pulsar un botón, se hunde 4 px. |
| `.mode-card` | `transform` y `box-shadow`, 0.1 s `steps(2)` | La tarjeta seleccionada (ratón encima, foco o flechas) se levanta 2 px con borde y sombra amarillos. |
| `.boot` | `opacity` 0.4 s `steps(4)` | La pantalla de arranque se desvanece en 4 saltos. |
| `.boot__bar span` | `width` 0.25 s `steps(4)` | La barra de carga avanza a trozos. |
| `.cine-game` | `clip-path` 0.6 s `steps(10)` | Cada juego tapa al anterior de abajo arriba, como una persiana. |
| `.cine-games__intro` | `opacity` 0.3 s `steps(3)` | El panel de tareas se va al entrar el primer juego. |
| `.game-hud__you` | `left` 0.15 s `linear` | Marcador del jugador en el minimapa. |

**Dos excepciones que no usan `steps()`:** `cine-kenburns` usa `ease-out` (se aplica a la portada del juego, que es
una imagen y no pixel art) y el marcador del minimapa usa `linear`: React actualiza su posición cada 150 ms y la
transición, que dura lo mismo, rellena el hueco entre dos lecturas.

---

## 2. CSS guiado por scroll (modo Cinematic)

Aquí la animación no depende del tiempo sino de **cuánto ha hecho scroll el usuario**. Si se para, la escena se
para; si sube, la animación va hacia atrás.

### Cómo funciona

1. Cada [`<Scene>`](../src/variants/scroll/Scene.jsx) es una sección muy alta (`length` × altura de pantalla) con un
   hijo `position: sticky` que se queda fijo mientras se recorre.
2. `useScrollTicker` escucha `scroll` y `resize` con **un solo listener compartido** y ejecuta los cálculos como
   mucho una vez por fotograma (`requestAnimationFrame`).
3. La escena calcula su progreso y lo escribe en una variable CSS:

   ```js
   const span = rect.height - window.innerHeight
   const p = span > 0 ? clamp01(-rect.top / span) : 1
   el.style.setProperty('--p', p.toFixed(4))
   ```

4. **El CSS convierte `--p` en movimiento** con `calc()` y `clamp()`. Cambiar la variable no provoca un render de React.

### El patrón básico: `Reveal`

```css
.r {
  --t: clamp(0, (var(--p) - var(--at)) / var(--len), 1);  /* entrada: 0 → 1 */
  --o: clamp(0, (var(--out) - var(--p)) / var(--len), 1); /* salida:  1 → 0 */
  --v: min(var(--t), var(--o));
  opacity: var(--v);
}

.r--up {
  transform: translateY(calc((1 - var(--v)) * 48px));
}
```

`--at` es el punto de la escena donde empieza (0.2 = al 20 %) y `--len` cuánto dura (0.08 por defecto).
`clamp()` recorta el resultado entre 0 y 1: antes de `--at` vale 0 y después de `--at + --len` vale 1.

| `from` | Movimiento |
|---|---|
| `up` (por defecto) | Sube 48 px. |
| `left` / `right` | Entra 90 px desde el lado. |
| `zoom` | Crece de 0.6 a 1. |
| `flip` | Gira 90° en el eje Y, como una carta. |
| `stamp` | Cae desde 3.5× de tamaño, girado −12°: el sello **REPORTED ✔**. |

### Efectos de cada escena

| Escena | Efecto | Cómo se consigue |
|---|---|---|
| Todas | El título empieza grande en el centro y se va a la esquina. | `--tt` = primer 10 % de la escena; interpola `top`, `left` y `scale`. |
| Todas | El contenido que no cabe se desplaza solo. | La escena mide cuánto sobra (`--ov-y` / `--ov-x`) y `.cine-pan-y` lo traslada entre el 30 % y el 90 %. |
| Start | Se empieza dentro del ojo del avatar y la cámara se aleja. | `scale` hasta 15× con `transform-origin: 31% 38%` (el ojo). El zoom es cuadrático, `(1 - z)²`, para que frene al final. |
| Start | El nombre cae letra a letra. | Cada letra tiene su índice `--i` y empieza `0.008` más tarde que la anterior. |
| Start | Las cifras cuentan hacia arriba. | Única parte con estado de React: `onProgress` redondea a 50 pasos para no renderizar en cada fotograma. |
| Profile | Las palabras se iluminan una a una. | `--n` = total de palabras, `--i` = índice; la opacidad pasa de 0.15 a 1. |
| Journey | Los niveles pasan en horizontal y el suelo se mueve. | `translateX` del carril con `--ov-x`; `background-position` del suelo con `--p`. |
| Quest log | Un juego por paso de scroll. | `onProgress` convierte `--p` en un índice; las clases `is-active` / `is-past` disparan las transiciones. |
| Skill tree | Las etiquetas llegan volando y girando. | Cada una tiene `--dx`, `--dy`, `--rot` y `--at` propios, generados con un pseudoaleatorio **determinista**. |
| Fondo | Estrellas con paralaje. | Dos capas que se mueven al 5 % y al 15 % del scroll. |

El pseudoaleatorio determinista (`rand(i, k)`, basado en `Math.sin`) devuelve siempre el mismo número para el mismo
índice. Así las etiquetas salen de posiciones que parecen al azar, pero no cambian de sitio en cada render.

---

## 3. Canvas 2D: bucles con `requestAnimationFrame`

Los tres canvas siguen el mismo esquema:

```js
const loop = (now) => {
  const dt = Math.min((now - last) / 1000, 0.05) // segundos desde el fotograma anterior
  last = now
  update(dt) // mover
  draw()     // pintar
  raf = requestAnimationFrame(loop)
}
```

- **Delta time (`dt`)**: todas las velocidades están en unidades por segundo y se multiplican por `dt`, así el juego
  va igual de rápido en una pantalla de 60 Hz que en una de 144 Hz.
- **Tope de `dt`** (0.05 s, o 0.033 s en el modo Game): si pasa mucho tiempo entre dos fotogramas (por ejemplo, al
  volver a la pestaña), los objetos no dan un salto enorme.
- **Limpieza**: al desmontar el componente se llama a `cancelAnimationFrame` y se quitan los listeners.

### Animación de sprites

Los sprites son listas de texto, un carácter por píxel; los bichos tienen dos fotogramas cada uno
([sprites.js](../src/sprites.js)). Para alternar entre ellos se usa un temporizador y un XOR. En Bug Invaders:

```js
g.frameTimer += dt
if (g.frameTimer > 0.45) {
  g.frameTimer = 0
  g.frame ^= 1 // 0 → 1 → 0 → 1…
}
```

### Qué se anima en cada canvas

| Canvas | Animaciones |
|---|---|
| [BackgroundBugs](../src/components/BackgroundBugs.jsx) | Los bichos deambulan cambiando de rumbo poco a poco, rebotan en los bordes y **huyen del ratón** (giran hacia el lado contrario y van 3× más rápido). Al aplastarlos: 14 partículas y el texto "FIXED!" que sube y se desvanece. |
| [BugInvaders](../src/components/BugInvaders.jsx) | Estrellas que caen a distinta velocidad (profundidad), enjambre que acelera según quedan menos bichos, partículas al destruirlos y nave que parpadea mientras es invulnerable. |
| [Modo Game](../src/variants/game/engine.js) | Ver la tabla siguiente. |

**Modo Game:**

| Elemento | Animación |
|---|---|
| Jugador | Balanceo de 1 px al caminar, parpadeo de ojos cada ~4 s, se voltea según la dirección, parpadea al recibir daño. |
| Cámara | Sigue al jugador con suavizado (`cam += (objetivo - cam) * dt * 5`) y se adelanta 16 px hacia donde mira. |
| Fondo | Paralaje: estrellas al 5 %, montañas al 20 % y colinas al 50 % de la velocidad de la cámara. Las estrellas titilan. |
| Banderas | Ondean con una onda seno y se izan al visitarlas. |
| Bloques **?** | Dan un bote de 3 px al golpearlos. |
| Máquinas arcade | Línea de barrido que cruza la pantalla de vez en cuando. |
| Taller | Cubo 3D en alambre que gira: 8 vértices rotados con seno y coseno y proyectados a 2D. |
| Efectos | Partículas en círculo con gravedad, textos flotantes ("FIXED!", "OUCH", "+ skill") y fuegos artificiales al terminar. |

Los parpadeos dentro del canvas se hacen con el reloj del juego, por ejemplo
`Math.floor(state.time * 20) % 2` alterna entre 0 y 1 veinte veces por segundo.

### Nitidez

Para que el pixel art no se vea borroso: coordenadas redondeadas con `Math.round`, `imageSmoothingEnabled = false`
(bichos de fondo y modo Game), `image-rendering: pixelated` en el CSS y, en el modo Game, una escala
(`state.scale`) que es siempre un número entero.

---

## 4. Animaciones con estado de React

| Animación | Archivo | Cómo funciona |
|---|---|---|
| Parpadeo del avatar | [Avatar.jsx](../src/components/Avatar.jsx), [shared.jsx](../src/variants/shared.jsx) | Un `setTimeout` aleatorio (2.5 – 5 s) cambia la fila de los ojos del sprite durante 150 ms. El intervalo aleatorio evita que parezca mecánico. |
| Pantalla de arranque | [BootScreen.jsx](../src/components/BootScreen.jsx) | Una línea nueva cada 280 ms; la barra de carga crece con cada línea y al final todo se desvanece en 400 ms. |
| Mapa de la trayectoria | [JourneyMap.jsx](../src/components/JourneyMap.jsx) | El avatar camina por la ruta a 70 píxeles de mapa por segundo siguiendo los puntos del camino, con un bote de 1 px cada 0.12 s. Si se pide otro destino a mitad de camino, termina el tramo y luego va al nuevo. |
| Aviso de la barra MODE | [PortfolioSwitcher.jsx](../src/components/PortfolioSwitcher.jsx) | Aparece a los 2.8 s de elegir modo y se quita a los 10 s. |
| Logros | [App.jsx](../src/App.jsx), [GamePortfolio.jsx](../src/variants/game/GamePortfolio.jsx) | El toast se muestra 4 s. |

---

## Accesibilidad: `prefers-reduced-motion`

Si el usuario tiene activada la opción "reducir movimiento" en su sistema:

| Parte | Qué pasa |
|---|---|
| Animaciones y transiciones CSS | Se desactivan todas con una regla global en [global.css](../src/styles/global.css) (`animation: none !important; transition: none !important`). |
| Scroll suave | `scroll-behavior` pasa a `auto`. |
| Pantalla de arranque y aviso "Bugs detected!" | No se muestran. |
| Bichos de fondo | El canvas no se monta. |
| Bug Invaders | La pantalla de título se queda quieta; el juego solo se mueve si el usuario pulsa **Start**. |
| Mapa de la trayectoria | El avatar salta directamente al nivel elegido, sin caminar. |
| Escenas del Cinematic | Siguen respondiendo al scroll, porque las mueve el propio usuario. |
| Modo Game (canvas) y parpadeo del avatar | No cambian: ni [engine.js](../src/variants/game/engine.js) ni el avatar comprueban esta preferencia. Las animaciones CSS del modo Game (ventanas, pantalla de inicio) sí se desactivan con la regla global. |

---

## Rendimiento

- Se animan sobre todo `transform` y `opacity`, que el navegador puede componer sin recalcular el diseño de la página. Las excepciones son puntuales: `box-shadow` en los hover, `width` en la barra de arranque, `clip-path` en los juegos del Cinematic, `left` en el minimapa y `top`/`left` en el título de cada escena.
- En Cinematic casi todo el movimiento lo hace el CSS: cada escena solo escribe tres variables (`--p`, `--ov-y`, `--ov-x`). React solo se vuelve a renderizar para el contador de cifras, el juego activo y el capítulo actual de la cabecera.
- Un único listener de scroll para todas las escenas, con `{ passive: true }` y limitado a una ejecución por fotograma.
- Bug Invaders deja de actualizar y pintar cuando sale de la pantalla (`IntersectionObserver`) y se pausa al cambiar de pestaña (`visibilitychange`).
- El modo Game predibuja los sprites en canvas pequeños una sola vez y solo pinta los objetos que están cerca de la cámara.
- En el mapa de la trayectoria, el paisaje (hierba, agua, camino, árboles) se construye una vez con `useMemo` y no se recalcula mientras el avatar camina.

---

## Cómo añadir una animación

**Un bucle o una entrada en CSS.** Reutiliza `bob`, `blink` o `pulse` si encajan. Si no, crea el `@keyframes` en el
CSS del modo correspondiente y usa `steps()`:

```css
.mi-elemento {
  animation: shake 0.3s steps(3);
}

@keyframes shake {
  50% {
    transform: translateX(4px);
  }
}
```

No hace falta nada más para respetar "reducir movimiento": la regla global la desactiva sola.

**Algo que aparece en una escena del Cinematic.** Envuélvelo en `<Reveal>`:

```jsx
<Reveal at={0.4} from="left">Entra desde la izquierda al 40 % de la escena</Reveal>
```

**Un efecto propio guiado por scroll.** Usa `--p` directamente en el CSS del elemento:

```css
.mi-elemento {
  --t: clamp(0, (var(--p) - 0.5) / 0.2, 1); /* de 0 a 1 entre el 50 % y el 70 % */
  transform: rotate(calc(var(--t) * 360deg));
}
```

**Algo dentro de un canvas.** Añade su estado al objeto, actualízalo en `update(dt)` multiplicando por `dt` y
píntalo en `draw()`. Para el modo Game, ver [arquitectura.md](arquitectura.md#motor-del-modo-game).

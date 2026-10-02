# Tecnologías

Qué se ha usado para construir el portfolio y por qué.

Lo que se usa y cómo se usa está comprobado en el código. Los "por qué" explican qué aporta cada tecnología a
este proyecto en concreto.

## Resumen

| Tecnología | Versión | Para qué |
|---|---|---|
| [React](#react-19) | 19 | Interfaz: componentes, estado y los tres modos. |
| [Vite](#vite-8) | 8 | Servidor de desarrollo y generación de la web final. |
| [JavaScript (ES Modules) + JSX](#javascript-y-jsx) | — | Lenguaje de todo el proyecto. |
| [CSS puro](#css-puro) | — | Estilos, diseño adaptable y la mayoría de animaciones. |
| [Canvas 2D](#canvas-2d) | API del navegador | Minijuego, bichos de fondo y modo Game. |
| [SVG](#svg) | — | Avatar y mapa de la trayectoria. |
| [Web Audio API](#web-audio-api) | API del navegador | Efectos de sonido. |
| [Almacenamiento web](#localstorage-y-sessionstorage) | API del navegador | Recordar modo, sonido, récord y avisos ya vistos. |
| [Google Fonts](#google-fonts) | — | Fuentes pixel. |
| Node.js + npm | Node 20 o superior (según el README) | Instalar dependencias y ejecutar Vite. |
| Git + GitHub | — | Control de versiones (el repositorio remoto está en GitHub). |

**Dependencias totales del proyecto: 4.** Dos en la web final (`react`, `react-dom`) y dos de desarrollo
(`vite`, `@vitejs/plugin-react`). Ver [package.json](../package.json).

---

## React 19

**Qué hace aquí:** cada sección es un componente, y [Root.jsx](../src/Root.jsx) decide cuál de los tres modos se monta.

**Por qué:**

- **Componentes reutilizables.** `Placeholder` y `Toast` se escriben una vez y se usan en varios modos; `PixelAvatar`
  y `SoundToggle` ([shared.jsx](../src/variants/shared.jsx)) los comparten la selección de modo, Cinematic y Game.
  El avatar del Classic es otro componente, pero dibuja el mismo sprite.
- **El contenido separado de la presentación.** El contenido (perfil, juegos, trayectoria, skills, enlaces) está en
  [portfolio.js](../src/data/portfolio.js) y los componentes lo recorren con `.map()`. Añadir un juego es añadir un
  objeto a una lista. Los rótulos propios de cada modo sí están en sus componentes (ver [contenido.md](contenido.md)).
- **Montar y desmontar limpio.** Al cambiar de modo, React desmonta el anterior y ejecuta la limpieza de sus
  `useEffect` (bucles de animación, listeners). Ningún modo se queda funcionando por detrás.

**Qué se usa de React:** solo hooks básicos (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`).

**Qué no se usa, y por qué:**

| No se usa | Motivo |
|---|---|
| Librería de estado (Redux, Zustand…) | El estado es pequeño y local a cada componente. |
| React Router | Solo hay tres "páginas" y se eligen con un parámetro de la URL (`?v=game`). Un `useState` es suficiente. |
| TypeScript | Todo el código es JavaScript (`.js` / `.jsx`); no hay paso de compilación de tipos. |

**React casi no participa en las animaciones de cada fotograma.** El movimiento se hace fuera: variables CSS en el
modo Cinematic y canvas en los juegos. React se actualiza cuando cambia algo que se lee (la puntuación, una ventana
que se abre). La excepción es el mapa de la trayectoria, donde la posición del avatar sí es estado de React mientras camina.

---

## Vite 8

**Qué hace aquí:** `npm run dev` levanta el servidor local y `npm run build` genera la carpeta `dist/`.

**Por qué:**

- **Arranca al instante** y refleja los cambios en el navegador sin recargar la página (*hot reload*), lo que ahorra mucho tiempo al ajustar animaciones y estilos.
- **Casi no necesita configuración.** [vite.config.js](../vite.config.js) tiene ocho líneas: el plugin de React y `base`.
- **Genera una web estática** (HTML, CSS y JS), que se puede alojar gratis en GitHub Pages, Netlify o Vercel sin servidor.

`base: './'` hace que las rutas sean relativas, para que la web funcione también dentro de una subcarpeta (`usuario.github.io/portfolio/`).

**Por qué no un framework con servidor (como Next.js):** el proyecto es una sola página con contenido fijo, sin
servidor ni base de datos, así que no necesita nada de lo que añaden.

---

## JavaScript y JSX

JavaScript moderno con módulos (`import` / `export`). JSX permite escribir la estructura de cada componente con una
sintaxis parecida a HTML dentro del propio JavaScript.

El sonido ([sound.js](../src/sound.js)) y los sprites ([sprites.js](../src/sprites.js)) son **JavaScript sin
ninguna dependencia**. El motor del modo Game ([engine.js](../src/variants/game/engine.js)) tampoco usa hooks ni
componentes de React: solo importa los datos, el nivel y los colores del avatar.

---

## CSS puro

**Qué hace aquí:** todo el aspecto visual, en cinco archivos dentro de [src/styles/](../src/styles/).

**Por qué sin Tailwind, Bootstrap ni Sass:**

- **El estilo pixel art es muy particular.** Las librerías de componentes traen esquinas redondeadas, sombras
  suaves y transiciones fluidas: justo lo contrario de lo que se busca. Habría que deshacer más de lo que se aprovecha.
- **El CSS actual ya cubre lo que antes pedía un preprocesador.** Se usan:

| Característica | Para qué |
|---|---|
| Variables (`--accent`) | Toda la paleta y las medidas en un solo archivo, [theme.css](../src/styles/theme.css). |
| `clamp()`, `min()`, `max()` | Tamaños fluidos sin *media queries*. |
| `calc()` con variables | Convertir el progreso del scroll en movimiento (modo Cinematic). |
| Grid y Flexbox | Rejillas que se adaptan solas al ancho. |
| `position: sticky` | Fijar cada escena mientras se hace scroll. |
| `steps()` | Animaciones a saltos, como fotogramas de un sprite. |
| `svh` | Altura de pantalla estable en móviles. |

**Por qué sin librería de animación (GSAP, Framer Motion):** el efecto principal del modo Cinematic (animar según
el scroll) se resuelve con una variable CSS y unas cien líneas de JavaScript
([Scene.jsx](../src/variants/scroll/Scene.jsx)), sin depender de terceros. Detalles en [animaciones.md](animaciones.md).

---

## Canvas 2D

**Qué hace aquí:** *Bug Invaders*, los bichos que caminan por el fondo y todo el modo Game.

**Por qué canvas y no elementos HTML:** en un juego hay decenas de objetos (bichos, disparos, partículas) moviéndose
en cada fotograma. Crear y mover un elemento HTML por cada uno es lento; en un canvas todo se pinta sobre una única
superficie. Además permite controlar cada píxel, imprescindible para el pixel art.

**Por qué sin motor de juegos (Phaser, PixiJS):**

- El juego es sencillo: un nivel, gravedad, colisiones entre rectángulos y unos pocos tipos de objeto.
  [engine.js](../src/variants/game/engine.js) lo resuelve en unas 700 líneas.
- Al estar hecho a mano, el motor incluye justo lo que el nivel necesita (*coyote time*, *buffer* de salto,
  movimiento independiente de los fotogramas por segundo) y no añade ninguna dependencia.

---

## SVG

**Qué hace aquí:** el avatar y el mapa de la trayectoria.

**Por qué SVG y no canvas para estas piezas:**

- **Se escala sin perder nitidez** a cualquier tamaño de pantalla.
- **Cada elemento es parte de la página:** los niveles del mapa se pueden pulsar y llevan `role="button"` y
  `aria-label` para lectores de pantalla; el mapa entero recibe el foco y se recorre con las flechas.
- React lo genera directamente a partir de los sprites de texto (un `<rect>` por píxel).

**Por qué no imágenes PNG:** al estar dibujado con código, los colores del avatar se cambian desde los datos y el
parpadeo es solo sustituir una fila del sprite. Con PNG haría falta un archivo por cada variante.

En el proyecto el reparto es: **SVG** para lo que es interactivo y tiene pocos elementos; **canvas** para lo
que tiene muchos objetos en movimiento continuo.

---

## Web Audio API

**Qué hace aquí:** genera todos los efectos de sonido en el momento, con osciladores y ruido
([sound.js](../src/sound.js)).

**Por qué sintetizar en vez de usar archivos de audio:**

- **Cero descargas:** no hay ni un solo archivo `.mp3` o `.wav`.
- **Encaja con la estética retro:** los efectos se hacen con ondas cuadradas, de sierra y ruido blanco.
- **No se usa audio de terceros.**
- Cada efecto son unas pocas líneas, fáciles de ajustar:

  ```js
  jump: () => tone({ freq: 280, to: 720, dur: 0.14, vol: 0.045 }), // tono que sube = salto
  ```

El sonido empieza **apagado** y solo se activa con el botón ♪. El contexto de audio se crea (o se reanuda) la
primera vez que suena un efecto, es decir, después de una interacción del usuario.

---

## localStorage y sessionStorage

**Qué hace aquí:** recordar el último modo elegido, si el sonido está activado y el récord de Bug Invaders
(`localStorage`), y si ya se han visto la pantalla de arranque y el aviso "Bugs detected!" en esta sesión
(`sessionStorage`). La lista de claves está en [arquitectura.md](arquitectura.md#datos-guardados-en-el-navegador).

**Por qué:** son preferencias que solo interesan a ese navegador. No hace falta base de datos, servidor ni cuentas
de usuario, y el código no usa cookies.

Todos los accesos van dentro de `try/catch`: si el navegador bloquea el almacenamiento, la web funciona igual.

---

## Google Fonts

**Press Start 2P** (títulos) y **VT323** (texto), cargadas desde [index.html](../index.html).

**Por qué:** son las dos fuentes que dan el aspecto pixel y de terminal. Se usa `display=swap` para que el texto se
vea desde el primer momento con la fuente de reserva (`monospace`) mientras llega la definitiva, y `preconnect` para
adelantar la conexión. Es el único recurso que la web carga de un servidor externo.

---

## Otras API del navegador

| API | Para qué |
|---|---|
| `requestAnimationFrame` | Bucles de animación sincronizados con la pantalla. |
| `IntersectionObserver` | Pausar Bug Invaders cuando sale de la pantalla. |
| `visibilitychange` | Pausar el minijuego al cambiar de pestaña. |
| `matchMedia` | Detectar "reducir movimiento", pantallas táctiles (`pointer: coarse`) y pantallas estrechas (≤ 640 px, para el mapa en vertical). |
| Pointer Events | Un mismo código para ratón, dedo y lápiz. |
| `URLSearchParams` + `history.replaceState` | Leer y escribir el modo en la URL (`?v=game`) sin recargar. |

---

## Por qué tan pocas dependencias

El README lo resume así: el portfolio está hecho "sin librerías externas de animación, juegos ni UI". En la práctica
eso supone:

1. **Peso.** El único código de terceros en la web final es React; el resto es código propio, imágenes y las dos fuentes.
2. **Mantenimiento.** Con cuatro paquetes hay muy poco que actualizar.
3. **Todo está a la vista.** El motor de scroll, la física del juego y el sonido están en el propio repositorio y se
   pueden leer y modificar.
4. **Control del estilo.** Ninguna librería impone su aspecto.

---

## Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| Node.js + npm | Ejecutar Vite e instalar paquetes. |
| Git + GitHub | Historial de cambios y copia del proyecto. |
| Netlify / Vercel / GitHub Pages | Opciones de publicación (ver el [README](../README.md#publicar)). |

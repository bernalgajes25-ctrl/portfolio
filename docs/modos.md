# Los modos del portfolio

## Cómo se elige el modo

1. **Primera visita** → pantalla **SELECT MODE** ([`ModeSelect.jsx`](../src/components/ModeSelect.jsx)):
   tres tarjetas con vista previa animada. Se elige con clic, con `← →` + `Enter`, o con las teclas `1` `2` `3`.
2. La elección se guarda en `localStorage` (`portfolio-variant`) y se añade a la URL (`?v=…`).
3. En las siguientes visitas se abre directamente el último modo.
4. La barra **MODE** (abajo a la izquierda, [`PortfolioSwitcher.jsx`](../src/components/PortfolioSwitcher.jsx))
   está siempre visible para cambiar de modo. Justo después de elegir en la pantalla inicial, parpadea y muestra
   el aviso *"Switch mode anytime here!"*.

**Prioridad al abrir la web:** `?v=` en la URL → modo guardado → pantalla de selección.
`?select` fuerza la pantalla de selección.

**Volver a ver la selección:** abrir con `?select`, o borrar la clave desde la consola del navegador
(`localStorage.removeItem('portfolio-variant')`) y recargar **sin** `?v=` en la URL.

---

## 1. Classic

Web de una sola página. Archivo principal: [`src/App.jsx`](../src/App.jsx).

### Secciones (en orden)

| # | Sección | Componente | Detalles |
|---|---|---|---|
| — | Pantalla de arranque | `BootScreen` | Terminal falsa que "carga" el perfil. Una vez por sesión; clic o tecla para saltarla. |
| — | Barra de navegación | `Navbar` | Enlaces a cada sección, menú hamburguesa en móvil, botón ♪ de sonido. |
| — | Hero | `Hero` + `Avatar` + `BugInvaders` | Nombre, rol, estadísticas, botones y el minijuego. |
| 01 | About me | `About` | Texto + tarjeta de "personaje". |
| 02 | My journey | `Journey` + `JourneyMap` | Mapa por el que camina el avatar (clic en un nivel o `← →`). |
| 03 | Games I've tested | `QAProjects` | Tareas generales + tarjeta por juego. |
| 04 | How I report a bug | `BugReport` | El bug report de ejemplo en forma de ventana. |
| 05 | Skills & tools | `Skills` | Grupos de etiquetas. |
| 06 | Development projects | `DevProjects` | Proyectos de DAM. |
| 07 | Other · 3D with Blender | `Gallery3D` | Galería con visor a pantalla completa. |
| 08 | Let's work together | `Contact` | Email, LinkedIn, GitHub, CV. |

### Bug Invaders (minijuego del hero)

*Space Invaders* con bichos ([`BugInvaders.jsx`](../src/components/BugInvaders.jsx)).

- La nave sigue al ratón o al dedo (o `← →`) y dispara sola.
- **Pausa:** `Enter`, `Esc` o `P`, o el botón **❚❚**. En pausa: **Resume** o **Quit game** (vuelve al título).
- Se pausa **automáticamente** si el juego sale de la pantalla o se cambia de pestaña.
- Al limpiar una oleada: **Next build** (más difícil) o **Restart**.
- El récord se guarda en `localStorage` (`bug-invaders-hi`).

### Easter eggs

| Secreto | Cómo se activa | Qué pasa |
|---|---|---|
| Bichos de fondo | Clic sobre los bichos que caminan detrás de la página. | Se aplastan; contador "bugs fixed" y logros a los 1, 10 y 25. Huyen del ratón. Si fallas por poco sale "MISS". |
| Debug mode | Código Konami `↑ ↑ ↓ ↓ ← → ← → B A`, **o** 5 clics rápidos en el avatar. | Todos los elementos muestran su "hitbox", aparece la etiqueta DEBUG BUILD y Bug Invaders dispara triple. Repetir para desactivar. |
| Pista del footer | — | El footer muestra el código Konami en tenue. |
| Aviso inicial | A los 7 s de entrar (una vez por sesión). | Toast "Bugs detected!" para descubrir los bichos. |

---

## 2. Cinematic

Portfolio contado con scroll, inspirado en la web de GTA VI. Carpeta: [`src/variants/scroll/`](../src/variants/scroll/).

Cada capítulo es una **escena** que se queda fija en pantalla mientras haces scroll; lo que cambia
es la animación. El título de cada capítulo aparece grande en el centro y se desplaza a la esquina superior izquierda.

| Capítulo | Qué pasa al hacer scroll |
|---|---|
| **Start** | Se empieza muy cerca de la cara del avatar y se aleja; el nombre cae letra a letra; las cifras cuentan hacia arriba; aparecen los botones. |
| **01 Profile** | Las palabras del "About me" se iluminan una a una; la tarjeta de perfil entra desde la derecha. |
| **02 Journey** | Los niveles pasan en horizontal sobre un suelo pixel mientras el avatar camina. |
| **03 Quest log** | Primero, las tareas de QA; después, un juego por paso de scroll a pantalla completa (portada con zoom lento, scanlines, datos y enlace). Barra de progreso con un segmento por juego. |
| **04 Save file** | El bug report se escribe por partes (campos, pasos, esperado/real, adjuntos) y al final cae el sello **REPORTED ✔**. |
| **05 Skill tree** | Las etiquetas llegan volando y girando desde todas partes y se colocan en su grupo. |
| **06 Side quests** | Proyectos entran desde la izquierda y los renders giran como cartas. |
| **07 Multiplayer** | "LEVEL COMPLETE", enlaces de contacto y "Play again" para volver arriba. |

**Elementos fijos:** cabecera con el capítulo actual y el sonido, barra de progreso de lectura arriba,
puntos de navegación a la derecha (escritorio) y estrellas de fondo con paralaje.

---

## 3. Game: *QA Quest*

Plataformas 2D dibujado en `<canvas>`. Carpeta: [`src/variants/game/`](../src/variants/game/).

### Controles

| Acción | Teclado | Móvil |
|---|---|---|
| Moverse | `← →` o `A D` | ◀ ▶ |
| Saltar (mantener = más alto) | `Espacio`, `W`, `↑` o `Z` | **A** |
| Abrir lo que tienes delante | `E`, `↓`, `S`, `Enter` o `X` | **B** |
| Cerrar ventana | `Esc`, `E` o `B` | ✕ |
| Menú rápido | `M` | ☰ Menu |

Cuando hay algo que se puede abrir aparece una tecla **E** (o **B** en móvil) sobre el personaje.

### El nivel (de izquierda a derecha)

| Lugar | Sección | Qué hay |
|---|---|---|
| Cartel inicial | — | Instrucciones. |
| 🏠 Casa **PROFILE** | About | Ventana con perfil, estadísticas y tarjeta de personaje. |
| ⚑ Banderas 1-1 … 1-4 y ??? | Journey | Cada bandera abre su nivel y se iza al visitarla. La última está bloqueada e invita a contactar. |
| 🖥 Terminal **BUG REPORT** | Bug report | El informe completo. La vigila el **bug crítico** (3 pisotones para eliminarlo). |
| 🕹 15 máquinas arcade | Games | Una por juego con su portada. Dentro: datos, enlace y botones ◀ Prev / Next ▶. El cartel abre el listado completo. |
| **?** Bloques | Skills | Un bloque por grupo. Cada golpe desde abajo suelta una skill; vacío = bloque gris. |
| ⚙ Taller **DEV & 3D** | Dev + Blender | Portátil y cubo 3D girando. |
| 🏁 Mástil + 🏰 castillo **CONTACT** | Contact | Tocar el mástil termina el nivel: sube la bandera, fuegos artificiales y se abre el contacto. |

### Enemigos y logros

- Bichos que patrullan: **salta encima** para arreglarlos ("FIXED!"). Si te tocan de lado, retroceso y "OUCH" (no se pierde la partida).
- Reaparecen al cabo de unos segundos.
- Logros: primer bug, 5 bugs, 15 bugs, bug crítico, grupo de skills completo, todas las skills, **100 % explorado** y **level complete**.

### HUD

Arriba: bugs arreglados, skills encontradas (x/26), secciones exploradas (x/7), botón de menú, sonido y
un **minimapa** con la posición del jugador y las secciones ya abiertas (en amarillo).

### Para quien tiene prisa

La pantalla de inicio ofrece **☰ Skip to menu**, y el **menú rápido** (`M`) teletransporta a cualquier
sección y la abre directamente, sin necesidad de jugar.

---

## Sonido

Todos los modos empiezan en **silencio**. El botón **♪ OFF/ON** activa los efectos y la elección se recuerda
(`localStorage`, clave `sfx`). Los sonidos se generan en el navegador (ver [arquitectura](arquitectura.md#sonido)).

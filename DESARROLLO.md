# Guía para continuar Hauskeepers

## Proyecto y estado

- GitHub: https://github.com/herse21/hauskeepers-showroom-v1
- URL del proyecto existente: https://hauskeepers-showroom-v1.vercel.app/
- Vercel: proyecto `hauskeepers-showroom-v1`, espacio `even16`.
- Stack: Next.js, React y TypeScript; versiones exactas en `pnpm-lock.yaml`.

La revisión actual retiró los montajes locales rechazados: tenían diferencias visibles de perspectiva, luz y bordes. La portada usa `kitchen-hardware-v4.webp`, una sola cocina generada coherente. SERVO-DRIVE, AVENTOS y SPACE TOWER v7 están integrados y revisados localmente. La primera toma AVENTOS v7 se rechazó porque abrió un gabinete inferior; la toma nueva eleva el frente blanco correcto. El registro local `work/seedance/unified-v7/production.json` identifica los intentos y su estado. Las generaciones usaron Seedance 2.5 Unlimited, 720p y hasta 10 s. Esta revisión no está publicada en Vercel.

## Ejecutar y comprobar

Con Node.js 20.9 o posterior y pnpm:

```sh
git clone https://github.com/herse21/hauskeepers-showroom-v1.git
cd hauskeepers-showroom-v1
pnpm install --frozen-lockfile
pnpm dev
```

Antes de entregar cambios de implementación, ejecuta las comprobaciones apropiadas:

```sh
pnpm run typecheck
pnpm run build
```

`pnpm build` genera `out/`. Con `output: 'export'`, `pnpm start` no sirve esa exportación; usa desarrollo o un servidor estático con URLs limpias. `.env.example` documenta las opciones públicas. Nunca incluyas secretos en variables `NEXT_PUBLIC_*`.

## Mapa del código activo

| Parte | Archivo o carpeta |
| --- | --- |
| Entrada de portada | `app/page.tsx` |
| Cocina continua, cámara y reproducción por segmentos | `components/interactive-showroom.tsx` |
| Fotografía, productos, encuadres, puntos y clips | `components/kitchen-media.ts` |
| Diseño del recorrido y adaptación por formato | `app/interactive-showroom.css`, `app/responsive.css` |
| Menú, logo único, pie, fichas y componentes compartidos | `components/experience.tsx`, `app/shell.css` |
| Componentes de las páginas interiores | `components/premium-home.tsx`, `app/premium.css` |
| Estilos base y componentes históricos | `app/styles.css` |
| Rutas interiores y privacidad | `app/[section]/page.tsx` |
| Estructura general, SEO y datos estructurados | `app/layout.tsx` |
| Contacto y fichas compartidas | `public/content/showroom.json`, `lib/content.ts` |
| Eventos y mensajes de WhatsApp | `lib/analytics.ts` |
| Recursos publicados | `public/assets/` |
| Exportación y alojamiento | `next.config.ts`, `vercel.json` |
| Procedencia de los recursos | `ASSET-SOURCES.json`, `FUENTES.md` |

Las portadas retiradas `home.tsx`, `reference-home.tsx`, `pillar-media.ts` y el export no utilizado `PremiumHome` se eliminaron en la limpieza autorizada. `PremiumCollection` sigue sirviendo las rutas interiores. Los campos `hero`, `selected`, `philosophy` y `process` del JSON conservan contenido histórico; no describen por sí solos el recorrido activo.

## Integrar los clips de la cocina

`kitchenScene` usa `/assets/kitchen-hardware-v4.webp`, de 1672×941, como plano común. `kitchenProducts` define SERVO-DRIVE para cajones, AVENTOS y SPACE TOWER. Las coordenadas son fracciones de esa imagen, con encuadres separados para escritorio y móvil.

Sólo se activa un clip después de inspeccionar su producto, movimiento y continuidad. El estado vigente se consulta en `components/kitchen-media.ts`. Un clip no recibido o rechazado conserva este contrato:

```ts
clip: {
  status: 'pending',
  video: null,
  width: null,
  height: null,
  wideFrame: null,
  intro: null,
  opening: null,
  closing: null,
  exit: null,
  detailHotspot: null,
  detailFraming: null,
}
```

Al recibir un archivo nuevo:

1. Identifica el MP4 recibido por nombre y hash; no confundas un clip histórico de fabricante con la generación nueva.
2. Mide resolución, FPS, duración y pistas; decodifica el archivo completo e inspecciona fotogramas y reproducción. La generación solicitada es 720p, no 4K.
3. Comprueba el producto previsto, la geometría, los objetos y la dirección del movimiento. Cada generación parte de un recorte exacto de la cocina común y conserva todo su encuadre durante la acción. No recuperes el montaje de muebles recortados sobre otra fotografía.
4. Mide `wideFrame` (plano general cerrado) y los intervalos `intro`, `opening`, `closing` y `exit`. El regreso termina en el plano general compartido. Una cámara que forma parte de la acción puede incluirse en `opening`/`closing`; `reveal` delimita el movimiento visible del cajón para la flecha. Registra dimensiones, `detailHotspot` y los puntos `hotspotMotion` sobre el video. Cambia a `ready` sólo después de inspeccionarlo.
5. Comprueba la reproducción integrada, las transiciones entre capítulos, la alternativa estática, el teclado, el movimiento reducido y el ahorro de datos. Confirma que no aparezcan saltos de encuadre, logo duplicado ni controles de apertura sin acción real.
6. Al incorporar los clips, actualiza la atribución de privacidad para identificar las animaciones como ilustraciones generadas con IA, además de su procedencia en los documentos técnicos. El aviso vigente describe los recursos que ya se muestran y no una generación pendiente.

`isKitchenClipReady` valida el estado, las dimensiones, las coordenadas y el orden de los segmentos sin solapamientos; el componente comprueba además que los segmentos no excedan la duración cargada. Estas validaciones no sustituyen la revisión visual. Mientras un clip está pendiente, el punto interactivo ofrece explorar la información y mantiene la fotografía. Los clips con cámara propia se reproducen en una capa del viewport independiente de la cámara CSS de la fotografía, para no duplicar el zoom.

El helper local `work/media-qa/inspect-video.py`, si está presente en esta copia de trabajo, genera muestras cada segundo y un reporte técnico. `work/` está ignorado por Git y no debe convertirse en un requisito oculto para otro desarrollador; pueden realizarse las mismas comprobaciones con FFmpeg y FFprobe disponibles en su equipo.

## Publicación y colaboración

Conserva la exportación estática: `framework: null`, `buildCommand: 'pnpm run build'` y `outputDirectory: 'out'` en `vercel.json`. No cambies al adaptador Next.js conservando una salida incompatible. Mantén el proyecto Vercel existente.

El repositorio es público y `main` es la rama de producción de la conexión Git existente. Usa una rama y un pull request para revisar cambios. Verifica el despliegue real y su commit antes de comunicar una publicación; esta guía no certifica que la revisión de trabajo esté en producción.

El acceso de escritura requiere un colaborador de GitHub específico; el enlace público no lo concede. Consulta el estado actual de invitaciones y permisos en GitHub, sin deducirlo de documentos históricos. No se incluyen tokens personales ni credenciales en el repositorio.

## Backend y límites de contenido

No hay endpoints de aplicación, base de datos, login, CRM, CMS conectado ni reserva automática. Las consultas se realizan por WhatsApp. `NEXT_PUBLIC_CONTENT_URL` permite reemplazar el JSON público compartido, pero la configuración de medios y cámara permanece en `kitchen-media.ts`.

Si se incorpora un backend Next.js, habrá que definir primero sus operaciones y datos, retirar `output: 'export'` y cambiar de forma coherente el adaptador y la salida de Vercel. Esta migración no está implementada.

Las fotos de fabricantes son referencias, no instalaciones propias de Hauskeepers. Las animaciones solicitadas mediante IA serán ilustrativas y no certifican la identidad, configuración o desempeño de modelos comerciales. Se eliminaron recursos de las propuestas retiradas; los clips oficiales MERIVOBOX y REVEGO continúan en las fichas interiores. Conserva la procedencia de los archivos que sigan almacenados.

## Historial de comprobaciones de versiones anteriores

Los apartados siguientes documentan comprobaciones anteriores al cambio de cocina v7. Sus capturas y medidas no certifican automáticamente los clips nuevos. Para el estado actual, consulta el inicio de esta guía, `kitchen-media.ts` y el registro v7.

### Ajustes de interacción del 10 de noviembre de 2026

- El área sticky usa `overflow: clip` para evitar desplazamientos internos al enfocar controles y la franja inferior descubierta.
- Un solo logo vectorial naranja conserva la geometría actual, arma el símbolo y revela el nombre, y pasa del centro a la esquina al deslizar. Naranja muestreado del GIF proporcionado: `#dc7536`. Movimiento reducido omite la animación.
- Encabezado transparente sobre la cocina; menú móvil expandido con fondo legible.
- Una flecha fina se dibuja desde el interior del mueble hacia la ficha translúcida, colocada arriba a la izquierda en escritorio y abajo en celular; logo oficial de Blum y sin filas de características. La información se oculta inmediatamente al cerrar; la flecha se recoge siguiendo el tiempo del video y se elimina al terminar el cierre.
- `lib/kitchen-motion.ts` transforma la posición entre segmentos espejados; `mirroredMotion` sólo debe activarse cuando el cierre utiliza los mismos fotogramas en reversa. Se verificaron 91 posiciones y cambios de dirección durante reproducción.
- Validación: build y TypeScript correctos; interacción visual en escritorio y 390×844, cierre a media apertura, reapertura durante cierre y desaparición inmediata de la ficha.

## Verificación por formato

Se revisaron las cuatro escenas a 320×568, 375×667, 430×932, 768×1024, 1024×768, 844×390, 1366×768 y 1920×1080. El formato horizontal pequeño de 568×320 se inspeccionó adicionalmente: ficha completa de 216 px, sin scroll interno necesario para la ficha anterior; encabezado compacto y flecha rodeando el control.

Las seis páginas interiores se comprobaron a 320×568, 568×320, 768×1024 y 1366×768: 24 comprobaciones sin desbordamiento horizontal ni de texto. También se probaron el menú móvil, cambio de marca, carrusel y modal de producto. Son comprobaciones de tamaños en Chrome; no sustituyen una prueba en cada dispositivo físico.

`motionOpenness` liga el trazo SVG al tiempo de apertura/cierre del clip, sin temporizador independiente. Al pausar el video se pausa el trazo; una inversión a media apertura conserva el porcentaje equivalente. La ficha queda invisible e inerte desde el clic de cierre, mientras la flecha permanece hasta terminar el movimiento.

La proporción de desplazamiento del recorrido se conserva cuando cambia la altura de la pantalla. Se comprobó el giro vertical/horizontal durante una apertura pausada: mismo capítulo, fotograma 5.2035 s y progreso 0.4542667 antes y después. Los registros y capturas están en `work/review/responsive/` (carpeta local de trabajo).

## Video completo en celular vertical

`lib/kitchen-framing.ts` interpola desde la portada inmersiva hacia un encuadre 16:9 que conserva todo el ancho del video. El producto no vuelve a recibir un zoom CSS que corte sus laterales. Los puntos interactivos y el origen de la flecha se proyectan sobre ese mismo rectángulo.

La pantalla completa se mantiene cubierta por una ambientación de la misma escena: un canvas toma los fotogramas del video activo, los amplía detrás y aplica desenfoque. Comparte la decodificación del video existente; no añade otro archivo ni otro reproductor. Se actualiza con `requestVideoFrameCallback`, con alternativa mediante `requestAnimationFrame`; se detiene fuera de vista y conserva el fotograma al pausar. El canvas usa resolución reducida porque sólo funciona como fondo difuminado; el producto nítido conserva el MP4 original a 1280×720.

En vertical, la ficha tiene un máximo de altura que deja libre el video. En el ancho mínimo se compactó el espacio entre Cotizar y Explorar para que ambos controles queden visibles en una sola fila. Se comprobó visualmente a 320×568 y en la vista local original de 396×743, además de las medidas intermedias. La información se oculta al cerrar y la flecha continúa siguiendo el cierre mientras el fondo permanece visible.


## Continuidad del recorrido

La versión anterior comenzaba y terminaba sus tres clips en un plano compartido. SERVO-DRIVE fundía la cocina con una toma lateral; AVENTOS sustituía el fondo derecho y SPACE TOWER conservaba su despensa. Ese enfoque fue rechazado y no debe restaurarse sobre la cocina v7.

En la revisión anterior, El derivado AVENTOS alinea sus primeros 48 fotogramas con una transformación global que se desvanece hasta identidad (escala X 1.02, desplazamiento X 30.4 px, escala Y 1.008, desplazamiento Y -2.4 px); los primeros 12 fotogramas parten del plano común. La acción del producto conserva los fotogramas y tiempos medidos. Los originales permanecen intactos.

El cambio de capítulo conserva la imagen decodificada, precarga el vecino disponible y no vuelve a exponer la antigua fotografía entre videos. Los dos lados del recorrido desaceleran hacia el plano general. Una imagen común, cuya opacidad depende del deslizamiento, cubre el instante de unión y la latencia de decodificación al invertir el recorrido. El encuadre móvil usa el tiempo presentado, y el sombreado no cambia al cambiar el texto del capítulo.

Se verificaron recorridos de ida y vuelta en escritorio y celular: capas de video opacas, sin exposición del fondo ni desbordamiento. Los fotogramas a ambos lados del cambio mantienen una diferencia media inferior a 0.1 niveles RGB (escala 0–255) en las regiones revisadas. La apertura parcial, el cierre reversible y la flecha sincronizada conservaron su funcionamiento. Esta revisión es local y no confirma una publicación.

## Limpieza autorizada del 10 de noviembre

Se retiraron exportaciones y cachés anteriores, dependencias de la herramienta temporal de vectorizado, portadas sin importar, recursos de la propuesta del horno, clip MERIVOBOX anterior y derivados/simulaciones de revisión reemplazados. Los manifiestos locales de `work/cleanup/` registran rutas, tamaños y hashes. Se mantienen el código activo, los logos, el GIF de marca, las fotos usadas en las fichas, el original AVENTOS, sus entradas de edición y las nuevas referencias. La limpieza no se extendió a otros proyectos ni a las descargas personales.

La aclaración más reciente del usuario mantiene el control circular naranja «+ / −» como interfaz de la página, centrado en el frente del cajón superior derecho del fondo. El video debe mostrar únicamente un breve empuje y la apertura automática del cajón; no se generan manos, botones físicos ni interfaz dentro del video. La flecha conserva la sincronía con los fotogramas y el cierre puede invertirse desde media apertura.

## Interacciones y marcas — revisión local del 11 de noviembre

- AVENTOS: el centro del control se interpola entre puntos medidos del frente elevado. El cierre usa el tiempo equivalente del segmento invertido, también al cambiar de dirección a media apertura.
- SPACE TOWER: el gabinete se detiene abierto en 80/24 s antes de ofrecer el segundo control para el cajón. La apertura completa llega a 119/24 s; el cierre del cajón se detiene en 159/24 s sin cerrar la puerta. Esta escena no dibuja flechas y utiliza una ficha más compacta.
- El quinto acceso del encabezado abre el configurador oficial de Blum, cuya URL se concentra en `lib/brand-resources.ts`.
- `BrandJourney` presenta cuatro marcas al deslizar. En inicio, `continuous` superpone las dos escenas durante un viewport adicional después del intervalo completo de SPACE TOWER. Ambas imágenes permanecen en el mismo plano de pantalla durante el fundido reversible; desaparece la entrada vertical que mostraba una unión horizontal. Los textos se retiran y aparecen por separado para evitar amontonarlos.
- Los cambios entre marcas conservan opaca la imagen saliente debajo de la entrante. Movimiento reducido sustituye el fundido por un cambio directo. La ruta `/marcas` reutiliza el recorrido sin superposición con la cocina.

Se comprobaron el fundido de ida y vuelta a 390×844 y 1280×800: ambas escenas ocupan de y=0 al borde inferior durante la unión, sin desbordamiento horizontal. Las capturas y los resultados de interacción están en `work/review/` (archivos locales de revisión, no requisitos del proyecto). Esta revisión no confirma una publicación en Vercel.

## Limpieza adicional autorizada del 11 de noviembre

Se retiraron cachés y compilaciones después de detener el servidor de desarrollo; se conservó `out/` y el servidor de revisión con soporte de rangos de video (`work/preview.mjs`). Además, se eliminaron 229 archivos de trabajo obsoletos: la corrección SPACE TOWER v2 sustituida por v3, capturas reemplazadas, referencias de la dirección retirada del frigorífico y fotogramas de inspección regenerables. Se conservaron los originales AVENTOS y SPACE TOWER, las entradas de sus scripts de edición, los masters vigentes, la referencia lateral del nuevo SERVO-DRIVE, los logos, el código, las dependencias, los informes finales y las capturas actuales.

Los manifiestos de `work/cleanup/` registran rutas y hashes. El último pase verificó que 218 archivos protegidos no cambiaron. No se limpiaron otros proyectos, perfiles de navegador ni archivos personales.

## SERVO-DRIVE cinematográfico — integración local del 11 de noviembre

El derivado retirado `kitchen-servo-drive-v4-720p.mp4` tenía 216 fotogramas, 24 fps y 9 s sin audio. Procedía de una generación Seedance 2.5 Unlimited de 10 s cuyos originales se conservan. Sus intervalos y puntos de control históricos no corresponden al archivo v7.

El círculo sigue puntos medidos del frente, también al invertir desde una apertura parcial. La ficha se coloca a la derecha en escritorio y debajo del video en celular; las tabletas verticales hasta 1024 px también muestran el video completo con la ambientación desenfocada de la misma escena. La decodificación completa pasó y la diferencia media entre fotogramas opuestos es 0.63 niveles RGB de 255. La revisión y sus pruebas permanecen locales; no certifican publicación en Vercel.


## Revisión v7 actual

La referencia única está en `work/seedance/unified-v7/kitchen-master.png` y sus recortes y prompts en `production.json` de esa carpeta. `prepare-web-clip.py` prepara una entrada y salida desde el plano general hasta el recorte exacto usado al generar cada video. El movimiento se conserva en el encuadre completo; no se usan máscaras locales para pegar muebles, frentes o fondos. La apertura debe inspeccionarse antes de medir el fotograma final y crear el segmento inverso.

SERVO-DRIVE v7 conserva la apertura de los fotogramas originales 48–156. El archivo web tiene 240 fotogramas a 24 fps: entrada 0–23, apertura 23–119, cierre 120–216 y salida 216–239. El cierre contiene los mismos fotogramas en reversa. `hotspotMotion` incluye el desplazamiento medido del frente y su `openness`, que controla la flecha mediante el tiempo del video. Se verificaron la inversión desde apertura parcial, la reapertura durante cierre y la desaparición inmediata de la ficha en escritorio y 390×844. El archivo pasó decodificación completa. Las pruebas quedan en `work/seedance/unified-v7/`.

SPACE TOWER v7 conserva los fotogramas originales 0–192. El archivo web usa la misma estructura de 240 fotogramas y se detiene en 77/24 s con la puerta abierta y el cajón cerrado. El cierre del cajón se detiene en 162/24 s y conserva la puerta abierta. Se verificaron ambos controles, la ausencia de flechas, el cierre desde apertura parcial y la retirada inmediata de la información a 320×568 y en escritorio. La ficha queda a la izquierda para dejar libre la despensa de la derecha.

AVENTOS v7 conserva los fotogramas originales 48–120 de una generación de seis segundos. Usa los mismos intervalos web que SERVO-DRIVE. El botón sigue el centro medido del frente que se eleva y `openness` sigue el interior descubierto. Se verificaron el cierre desde media apertura, la ficha completa sin desplazamiento interno a 320×568, 390×844 y 768×1024, y la composición en escritorio. Al cambiar de tamaño se conservó la apertura.

Los planos generales de unión tienen diferencias medias inferiores a un nivel RGB de 255 a 320×180, correspondientes a la compresión. Las dos uniones se comprobaron también en Chrome de ida y vuelta: los videos cubren el viewport y se encuentran sobre la misma imagen común, sin una franja descubierta. Los tres MP4 pasaron decodificación completa y el build con TypeScript pasó. Los registros locales se encuentran en `work/seedance/unified-v7/`.

Los anclajes de producto usan `scroll-margin-top: 30svh` para entrar dentro del intervalo quieto. Así el acceso directo y el menú no dejan el control en el límite del siguiente desplazamiento.

Se retiraron 492 archivos de caché y de montajes rechazados, equivalentes a 177,052,634 bytes. El manifiesto `work/cleanup/2026-11-11-rejected-composites-v4-v6.json` verificó intactos 19 archivos protegidos, incluidos código, referencias actuales, originales y entradas históricas necesarias. La vista estática `out/` sigue activa; las dependencias se conservaron.

Después de integrar las tres tomas, se retiraron siete exportaciones reemplazadas y archivos temporales reproducibles: 23,969,691 bytes. El manifiesto `work/cleanup/2026-11-11-unified-v7-obsolete-exports.json` verificó intactos 16 archivos protegidos de la versión vigente. Se conservaron los originales, la imagen común, las referencias, el código y los tres MP4 publicados en la vista local.

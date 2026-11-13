# Hauskeepers — Showroom digital

Repositorio: https://github.com/herse21/hauskeepers-showroom-v1

URL del proyecto existente: https://hauskeepers-showroom-v1.vercel.app/

La portada abre con el hero integrado al recorrido por la cocina con SERVO-DRIVE, AVENTOS y SPACE TOWER. Después aparece el configurador Blum, seguido de Blum, REHAU, Häfele y Stone Fusion. Los puntos interactivos permiten consultar información y cotizar por WhatsApp. El logo SVG aparece una sola vez y pasa del centro al encabezado. Las fichas y flechas cambian de posición según el formato. En celular vertical el producto conserva todo el ancho del video y una ambientación de la misma escena cubre el fondo. La flecha sigue el movimiento del video al pausarlo o cambiar de dirección.

**Estado de los medios — revisión local terminada:** SERVO-DRIVE y AVENTOS usan sus tomas v7. SPACE TOWER usa `kitchen-space-tower-v8-720p.mp4`, con cinco cajones interiores y una transición de cuadro completo desde la cocina común. SERVO-DRIVE y AVENTOS abren y cierran desde puntos intermedios; el control sigue el frente y la flecha sigue la apertura medida. SPACE TOWER tiene controles separados para puerta y cajón, sin flechas. Los originales se guardaron y los montajes rechazados se retiraron. Build y revisión visual en celular, tableta y escritorio correctos. Esta revisión sigue siendo local; no se ha publicado en Vercel.

## Ejecutar

Con Node.js 20.9 o posterior y pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm run typecheck
pnpm build
```

Next.js, React y TypeScript generan una exportación estática en `out/`. `vercel.json` publica esa carpeta con `framework: null`. Para trabajar localmente usa `pnpm dev`; `pnpm start` no sirve esta exportación.

## Capacidad y entrega

Las rutas y los recursos se generan al compilar y se sirven desde la CDN. El navegador ejecuta las interacciones de la cocina y comienza a solicitar los videos al acercarse al recorrido. Cada visita usa su propio estado y no hay funciones ni conexiones a una base de datos por visita. WhatsApp y el configurador se abren en sus respectivos servicios. Los clips con versión se guardan en caché del navegador durante siete días. Cuando cambie un clip, incrementa su versión en el nombre y actualiza `components/kitchen-media.ts`.

## Dónde editar

- `components/interactive-showroom.tsx`: recorrido continuo, cámara, puntos interactivos y reproducción por segmentos.
- `components/kitchen-media.ts`: fotografía común, productos, posiciones, encuadres y estados de los tres clips.
- `app/interactive-showroom.css`: composición del recorrido y adaptación móvil.
- `app/page.tsx`: portada y acceso al configurador de Blum.
- `components/brand-journey.tsx` y `app/brand-journey.css`: fotografías, navegación y transiciones entre marcas.
- `components/experience.tsx` y `app/shell.css`: logo, encabezado, pie, fichas y controles compartidos.
- `public/content/showroom.json`: contacto, fichas de soluciones y contenido compartido.
- `components/premium-home.tsx` y `app/premium.css`: componentes que aún utilizan las rutas interiores.
- `app/[section]/page.tsx`: soluciones, inspiración, marcas, profesionales, showroom y privacidad.

`PremiumCollection` sigue atendiendo las páginas interiores. `hero.video` del JSON no determina el video del recorrido continuo.

## Medios y continuidad

Antes de integrar cambios en la portada, comprueba en el navegador el avance del video al deslizar, la apertura y el cierre de los tres muebles y la sincronización de las fichas con sus flechas. Repite la revisión en escritorio y celular y verifica los fotogramas visibles.

La cocina común vigente es `public/assets/kitchen-hardware-v4.webp` (1672×941), una sola ilustración de cocina con isla de dos cajones. Los originales y sus entradas de edición se conservan. SERVO-DRIVE y AVENTOS se generaron a partir de recortes de la cocina común. SPACE TOWER recupera una toma anterior con cinco cajones y se enlaza al mismo plano general. Sus tiempos y puntos se midieron después de inspeccionar cada archivo. Cada derivado web tiene 240 fotogramas a 24 fps, sin audio, con entrada y salida al mismo plano general. Un futuro clip todavía no recibido debe conservar sus campos en `null`.

Los clips solicitados son ilustraciones generadas con IA a 720p. No deben presentarse como grabaciones reales del showroom, demostraciones certificadas de un modelo específico ni material 4K. Las fotografías y clips históricos de fabricantes tienen resoluciones diferentes; no se sustituyen automáticamente por los clips nuevos ni se anuncian todos como UHD. El video de Pexels de la propuesta anterior ya no forma parte de la portada activa.

El logo es vectorial, reconstruido a partir del avatar público de Instagram; no equivale al archivo maestro entregado por la marca. El naranja `#dc7536` se muestreó del GIF original aportado por el usuario. La procedencia de los recursos se conserva en `ASSET-SOURCES.json` y `FUENTES.md`.

## Contacto, contenido y colaboración

WhatsApp prepara mensajes sencillos con la solución o marca seleccionada. El visitante decide si los envía. La sección de origen permanece en los eventos de medición y no se agrega como texto al mensaje. No se prometen precios ni existencias.

`NEXT_PUBLIC_CONTENT_URL` permite leer el esquema compartido desde un endpoint público, pero no incluye un CMS ni controla los encuadres o clips de `kitchen-media.ts`. No hay backend, base de datos, login, CRM, agenda automática ni receptor externo de analítica. Los eventos se exponen en `window.dataLayer` y `hauskeepers:analytics`.

El repositorio es público; compartir su enlace permite leerlo, clonarlo o proponer cambios. La escritura directa se administra mediante colaboradores específicos. Conserva el proyecto Vercel existente y revisa su resultado de despliegue antes de afirmar que un cambio está publicado. La URL anterior no prueba que esta revisión esté en producción.

Consulta `DESARROLLO.md` para continuar la implementación.

El control circular naranja «+ / −» es una interfaz de la página, centrado en el frente del cajón que se muestra en la escena. El video debe mostrar únicamente un breve empuje y la apertura automática del cajón; no se generan manos, botones físicos ni interfaz dentro del video. La flecha conserva la sincronía con los fotogramas y el cierre puede invertirse desde media apertura.

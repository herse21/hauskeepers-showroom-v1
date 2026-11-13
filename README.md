# Hauskeepers — Showroom digital

Repositorio: https://github.com/herse21/hauskeepers-showroom-v1

URL del proyecto existente: https://hauskeepers-showroom-v1.vercel.app/

La portada abre con una cocina en Three.js. El desplazamiento mueve la cámara. Los controles sobre cada mueble abren el cajón SERVO-DRIVE, el frente AVENTOS HK top y la puerta de SPACE TOWER. La despensa da acceso individual a sus cinco cajones y los recoge antes de cerrar la puerta. Después del recorrido aparecen el configurador Blum y las secciones de marcas.

**Estado de los medios.** La portada muestra un render de la cocina actual mientras Three.js y sus materiales inician. Si falla la carga, la portada conserva ese render y muestra un aviso. Los herrajes AVENTOS HK top, SERVO-DRIVE con MOVENTO y SPACE TOWER usan STEP oficiales de Blum E-SERVICES convertidos a GLB con Meshopt. Las referencias de los STEP están en `ASSET-SOURCES.json`. El mobiliario y las animaciones se prepararon para el showroom.

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

La vista local `/showroom-3d/` contiene tres demostraciones y los clips anteriores para comparación. El modelo de SPACE TOWER se carga desde `public/assets/blum-space-tower.glb`. Su origen y las medidas de referencia se registran en `ASSET-SOURCES.json`. Los pivotes y las piezas móviles se vinculan en `lib/blum-space-tower.ts`.

Si se reemplaza el modelo de SPACE TOWER, se debe regenerar su archivo de transferencia gzip sin pérdida con `node -e "const fs = require('node:fs'); const zlib = require('node:zlib'); const path = 'public/assets/blum-space-tower.glb'; fs.writeFileSync(path + '.gz', zlib.gzipSync(fs.readFileSync(path), { level: 9 }));"`.

- `components/kitchen-showroom-3d.tsx`: capítulos, progreso de scroll, controles manuales y recuperación sin WebGL.
- `lib/blum-review-scene.ts`: cocina, materiales, iluminación, cámaras y movimiento de los tres mecanismos.
- `app/kitchen-three.css`: interfaz de la portada y adaptación móvil.
- `app/page.tsx`: portada y acceso al configurador de Blum.
- `components/brand-journey.tsx` y `app/brand-journey.css`: fotografías, navegación y transiciones entre marcas.
- `components/experience.tsx` y `app/shell.css`: logo, encabezado, pie, fichas y controles compartidos.
- `public/content/showroom.json`: contacto, fichas de soluciones y contenido compartido.
- `components/premium-home.tsx` y `app/premium.css`: componentes que aún utilizan las rutas interiores.
- `app/[section]/page.tsx`: soluciones, inspiración, marcas, profesionales, showroom y privacidad.

`PremiumCollection` sigue atendiendo las páginas interiores. `hero.video` del JSON no determina el video del recorrido continuo.

## Medios y continuidad

Antes de integrar cambios en la portada, comprueba el recorrido hacia delante y hacia atrás, la apertura y el cierre manual de los tres mecanismos y el orden de puerta y cajón de SPACE TOWER. Repite la revisión en escritorio y celular.

La cocina común vigente es `public/assets/kitchen-hardware-v4.webp` (1672×941), una sola ilustración de cocina con isla de dos cajones. Los originales y sus entradas de edición se conservan. SERVO-DRIVE y AVENTOS se generaron a partir de recortes de la cocina común. SPACE TOWER recupera una toma anterior con cinco cajones y se enlaza al mismo plano general. Sus tiempos y puntos se midieron después de inspeccionar cada archivo. Cada derivado web tiene 240 fotogramas a 24 fps, sin audio, con entrada y salida al mismo plano general. Un futuro clip todavía no recibido debe conservar sus campos en `null`.

Los clips solicitados son ilustraciones generadas con IA a 720p. No deben presentarse como grabaciones reales del showroom, demostraciones certificadas de un modelo específico ni material 4K. Las fotografías y clips históricos de fabricantes tienen resoluciones diferentes; no se sustituyen automáticamente por los clips nuevos ni se anuncian todos como UHD. El video de Pexels de la propuesta anterior ya no forma parte de la portada activa.

El logo es vectorial, reconstruido a partir del avatar público de Instagram; no equivale al archivo maestro entregado por la marca. El naranja `#dc7536` se muestreó del GIF original aportado por el usuario. La procedencia de los recursos se conserva en `ASSET-SOURCES.json` y `FUENTES.md`.

## Contacto, contenido y colaboración

WhatsApp prepara mensajes sencillos con la solución o marca seleccionada. El visitante decide si los envía. La sección de origen permanece en los eventos de medición y no se agrega como texto al mensaje. No se prometen precios ni existencias.

`NEXT_PUBLIC_CONTENT_URL` permite leer el esquema compartido desde un endpoint público, pero no incluye un CMS ni controla los encuadres o clips de `kitchen-media.ts`. No hay backend, base de datos, login, CRM, agenda automática ni receptor externo de analítica. Los eventos se exponen en `window.dataLayer` y `hauskeepers:analytics`.

El repositorio es público; compartir su enlace permite leerlo, clonarlo o proponer cambios. La escritura directa se administra mediante colaboradores específicos. Conserva el proyecto Vercel existente y revisa su resultado de despliegue antes de afirmar que un cambio está publicado. La URL anterior no prueba que esta revisión esté en producción.

Consulta `DESARROLLO.md` para continuar la implementación.

El control circular naranja «+ / −» es una interfaz de la página, centrado en el frente del cajón que se muestra en la escena. El video debe mostrar únicamente un breve empuje y la apertura automática del cajón; no se generan manos, botones físicos ni interfaz dentro del video. La flecha conserva la sincronía con los fotogramas y el cierre puede invertirse desde media apertura.

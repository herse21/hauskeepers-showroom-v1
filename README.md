# Hauskeepers — Showroom digital V1

Repositorio: https://github.com/herse21/hauskeepers-showroom-v1

Página publicada: https://hauskeepers-showroom-v1.vercel.app/

Landing en Next.js, React y TypeScript, exportada como HTML estático para Vercel. La portada tiene tres secciones: hero con fotografía expansiva y marca protagonista, galería oscura de cinco tarjetas y visita al showroom («Hay cosas que tienes que abrir para entender»). Las páginas interiores conservan su contenido y cierre de contacto.

El logo es un SVG de trazados, sin imágenes incrustadas; se mantiene nítido al ampliarse. Es un único elemento compartido entre el hero y el encabezado. Durante el scroll se centra sobre la imagen y, al salir del hero, se acomoda arriba a la izquierda. En móvil se mantiene en el centro de la imagen y después pasa al encabezado.

## Ejecutar

Con Node 20.9 o posterior y pnpm:

```sh
pnpm install
pnpm dev
pnpm build
```

La compilación genera `out/`. `vercel.json` publica esa exportación estática; no requiere un servidor de aplicación en producción.

## Entrega a otro desarrollador

Este repositorio contiene todo el código existente, los estilos, los textos, las imágenes, los videos, la fuente y la configuración de compilación y publicación. Consulta [DESARROLLO.md](DESARROLLO.md) para ubicar los archivos, trabajar en ramas y preparar una futura ampliación del backend.

El repositorio es público: cualquiera puede consultar el código, clonarlo y proponer cambios mediante un fork y un pull request. Para editar directamente este repositorio, el propietario debe invitar a la persona en **Settings → Collaborators** con su usuario de GitHub. El enlace por sí solo no concede permiso de escritura.

GitHub está conectado al proyecto existente de Vercel, con `main` como rama de producción. Los cambios autorizados por Vercel en esa rama generan un despliegue automático. El espacio usa Hobby y el repositorio ahora es público; la restricción de colaboración de repositorios privados ya no describe este repositorio. Las contribuciones externas pueden requerir revisión o autorización. Consulta la [documentación de colaboración de Vercel](https://vercel.com/docs/deployments/troubleshoot-project-collaboration).

La versión actual no tiene backend de aplicación, base de datos, autenticación ni panel de administración. El contenido está en JSON y las consultas abren WhatsApp. Se entrega el proyecto completo tal como existe; un backend nuevo se desarrolla dentro de este mismo repositorio cuando se defina su alcance.

## Editar contenido

`public/content/showroom.json` concentra contacto, promoción, soluciones, acabados, inspiración, galería, manifiesto y proceso. Los componentes cargan este archivo en el navegador y conservan una versión inicial renderizada en HTML.

- Cambia `hero.image`, `selected[].image` o `solutions[].image` para sustituir fotografías.
- Los archivos se guardan en `public/assets/`.
- Para las imágenes `.webp`, conserva también la variante `-sm.webp` para celular.
- `promotion.enabled` activa o desactiva la promoción.
- `philosophy` y `process[]` se conservan como datos históricos; ya no se muestran en la portada.
- `contact.phone` usa formato internacional sin `+`.
- Las características comerciales de cada solución tienen una fuente y un estado de verificación.

La edición local del JSON se distribuye con un nuevo despliegue. Para edición de contenido sin recompilar el frontend, `NEXT_PUBLIC_CONTENT_URL` permite leer el mismo esquema desde un CMS o endpoint público HTTPS con CORS. La V1 deja ese adaptador preparado; no incluye una cuenta de CMS ni un panel conectado.

## Contacto y medición

Cada consulta prepara un enlace a WhatsApp con la solución, marca y sección de origen. La V1 no envía mensajes automáticamente. No hay precios ni inventario prometido.

Los eventos se exponen en `window.dataLayer` y mediante el evento `hauskeepers:analytics`: vistas, consultas de WhatsApp, apertura de soluciones, profundidad de scroll, filtros, inspiración, actividad profesional y navegación de la galería. No hay proveedor externo de analítica, CRM ni chatbot conectado.

## Imágenes y fuentes

El logo se reconstruyó como SVG a partir del avatar público original de Instagram, conservando el símbolo y el wordmark. Es una vectorización, no un archivo maestro proporcionado por la marca. El naranja aproximado se obtuvo del raster, no de un manual oficial. Las fotografías de fabricantes son inspiración o demostración de producto; no se presentan como obras hechas por Hauskeepers. Véase `FUENTES.md` y `ASSET-SOURCES.json`.

## Alcance de V1

Home y páginas de soluciones, inspiración, marcas, profesionales, showroom y privacidad. Navegación por teclado, diálogo nativo, foco visible, alternativa de movimiento reducido, versiones responsive, metadatos, Open Graph, robots y sitemap.

La identidad exacta y el catálogo oficial de Stone Fusion quedaron pendientes de corroboración pública. Se conserva una consulta comercial por marca, sin publicar especificaciones, inventario ni adjudicarle material de empresas homónimas. Häfele aparece como línea de consulta; no se atribuyen productos concretos en stock.

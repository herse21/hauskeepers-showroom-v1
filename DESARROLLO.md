# Guía para continuar Hauskeepers

## Proyecto y ejecución

- GitHub: https://github.com/herse21/hauskeepers-showroom-v1
- Producción: https://hauskeepers-showroom-v1.vercel.app/
- Vercel: proyecto `hauskeepers-showroom-v1`, espacio `even16`.
- Stack: Next.js, React y TypeScript; versiones exactas en `pnpm-lock.yaml`.

Con Node.js 20.9 o posterior y pnpm instalados:

```sh
git clone https://github.com/herse21/hauskeepers-showroom-v1.git
cd hauskeepers-showroom-v1
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` abre el servidor de desarrollo. Antes de entregar un cambio:

```sh
pnpm run typecheck
pnpm run build
```

`pnpm build` genera `out/`. Con `output: 'export'`, `pnpm start` no sirve esta exportación; usa `pnpm dev` para editar y un servidor estático compatible con URLs limpias para revisar `out/`.

No se necesita ninguna variable secreta para ejecutar la versión actual. `.env.example` documenta las dos opciones públicas. Toda variable `NEXT_PUBLIC_*` es visible en el navegador y no debe contener secretos.

## Dónde editar

| Parte | Archivo o carpeta |
| --- | --- |
| Portada activa: hero, tarjetas y visita | `components/reference-home.tsx` |
| Menú, logo animado, pie, fichas y componentes compartidos | `components/experience.tsx` |
| Diseño y ajustes móviles | `app/styles.css` |
| Rutas interiores | `app/[section]/page.tsx` |
| Estructura general, SEO y datos estructurados | `app/layout.tsx` |
| Textos, contacto y catálogo | `public/content/showroom.json` |
| Tipos y lectura de contenido | `lib/content.ts` |
| Eventos de medición y enlaces a WhatsApp | `lib/analytics.ts` |
| Fotos, videos, logo SVG y tipografía | `public/assets/` |
| Exportación estática y hosting | `next.config.ts`, `vercel.json` |
| Procedencia de recursos y límites de las afirmaciones | `FUENTES.md`, `ASSET-SOURCES.json` |
| Verificación histórica de la V1 | `QA.md` |

`components/home.tsx` conserva una propuesta anterior; no es la portada que usa `app/page.tsx`. `philosophy` y `process` en el JSON son datos históricos y no se muestran en la portada vigente.

## Publicación y colaboración

La conexión Git de Vercel apunta a este repositorio y a `main` como rama de producción. Conserva el proyecto y el dominio existentes. Trabaja en una rama y abre un pull request para revisar cambios antes de integrarlos en `main`.

La configuración actual utiliza `framework: null`, `buildCommand: 'pnpm run build'` y `outputDirectory: 'out'` en `vercel.json`. No cambies el adaptador a Next.js manteniendo `out/`: se publica una exportación estática.

El permiso de GitHub se administra en **Settings → Collaborators**. El acceso a Vercel es independiente. Se verificó el 2 de noviembre de 2026 que el espacio `even16` usa Hobby. Para repositorios privados, [Vercel exige que el autor del commit de despliegue sea el propietario del espacio](https://vercel.com/docs/deployments/troubleshoot-project-collaboration). Dar acceso de escritura en GitHub no elimina esta restricción.

Con este plan, el colaborador debe trabajar en una rama y enviar un pull request. El propietario puede revisarlo e integrarlo con **Create a merge commit**, conservando el historial y generando el commit de integración desde su cuenta. Verifica que el despliegue de ese commit termine en Ready. No se ha probado aún con una segunda persona porque falta su usuario.

Si la persona debe publicar de forma independiente, habrá que decidir un plan y permisos de Vercel compatibles con esa colaboración, o evaluar hacer público el repositorio. No se cambió el plan ni se hizo público el código. No se incluyen ni se deben compartir tokens personales de GitHub o Vercel.

## Backend: estado actual y ampliaciones

No existen endpoints de servidor, base de datos, login, CRM ni panel de administración. El JSON local no es una base de datos. `NEXT_PUBLIC_CONTENT_URL` permite leer un JSON externo público, pero no incluye un CMS contratado o configurado. Los eventos se exponen en el navegador sin receptor externo de analítica.

Si se necesita un backend dentro de Next.js, primero hay que definir los datos y operaciones. Después se puede retirar `output: 'export'`, migrar la configuración de Vercel al adaptador Next.js y retirar la salida forzada `out/` tanto del archivo como de cualquier ajuste del proyecto. Los endpoints pueden añadirse en `app/api/**/route.ts`. La base de datos y sus secretos se configuran por separado en el proveedor y en Vercel; no se guardan en Git.

Esta guía no afirma que esa migración ni un backend estén implementados.

## Reglas visuales que deben conservarse

- El logo activo es `public/assets/hauskeepers-logo.svg` y debe seguir siendo vectorial.
- En la portada hay una sola instancia visual del logo: del centro de la foto a la esquina del encabezado, y a la inversa al regresar.
- La portada tiene únicamente hero, cinco tarjetas y «Hay cosas que tienes que abrir para entender», además del pie.
- Revisar el scroll y el menú en móvil, con teclado y con movimiento reducido cuando se toque esa parte.
- Las fotos de fabricantes son demostraciones o inspiración; no deben describirse como instalaciones propias de Hauskeepers.

El repositorio no incluye credenciales, dependencias instaladas, compilaciones ni archivos temporales de trabajo. Los recursos de marca y de fabricantes conservan sus derechos originales; no se ha agregado una licencia de código abierto que pretenda relicenciarlos.

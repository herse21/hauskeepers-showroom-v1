# Verificación — portada simplificada y logo vectorial

Fecha: 21 de octubre de 2026.

- Compilación de producción y revisión de tipos sin errores.
- Vercel: `dpl_AQMBZhNSceeybqwuioj3GSP8c6Cj`, estado READY.
- La portada tiene exactamente tres secciones: hero, cinco tarjetas y visita («Hay cosas que tienes que abrir para entender»).
- Se retiraron filosofía, proceso y el cierre adicional de contacto de la portada. Se conserva el pie de página.
- El logo activo es un SVG de trazados sin raster incrustado. Se reconstruyó desde el avatar original, con geometría limpia para el símbolo. Se renderizó e inspeccionó a 3840 px de ancho.
- Revisión visual local en Chromium: escritorio de 1440 × 900 y móvil de 390 × 844. Sin desbordamiento horizontal; una sola instancia visual del logo en la portada.
- Se comprobaron el logo inicial, su posición sobre la imagen y su paso a la esquina del encabezado, en escritorio y móvil.
- La galería enlaza directamente con la visita, sin los bloques eliminados entre ambas.
- La página de soluciones conserva sus siete soluciones y su cierre de contacto.
- Las fuentes de las páginas interiores y el JSON de contenido se conservaron sin cambios; el SVG también se utiliza en sus encabezados y pies.
- El alias público respondió HTTP 200 para portada, soluciones y SVG. Se confirmó en producción la estructura de tres secciones y la carga del SVG.
- Las consolas local y publicada no registraron errores ni advertencias durante la revisión.

No se probó en un iPhone físico ni en Safari nativo. El SVG es una vectorización fiel del material público, no el archivo maestro de la marca.

## Revisión móvil de la versión publicada

- Se verificó el alias público en vistas de 320 × 740, 390 × 844 y 430 × 932.
- Al inicio, el centro del logo coincide con el centro de la imagen en las tres vistas.
- En 390 px se revisaron posiciones intermedias, llegada al encabezado y regreso al centro; siempre hubo una sola instancia `.logo`.
- Al terminar la transición, el logo tiene 180 px de ancho, a 24 px del borde izquierdo y centrado en el encabezado.
- El recurso activo es el SVG, sin desbordamiento horizontal ni errores o advertencias de consola en los estados revisados.
- No se requirieron cambios de código ni un nuevo despliegue. Esta revisión corresponde a Chromium con tamaños móviles, no a un teléfono físico.

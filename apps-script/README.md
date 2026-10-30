# Migración del dashboard a Google Sheets

## Estado
Preparación en la rama `feat/google-sheets-live-data`. La web pública `main` no se ha modificado.

## Fuente de datos
Spreadsheet: `Marcas Potenciales Colab Pauli`
ID: `1G97uQX0DxDt2k-7unOhVmStkOBULWuaMJ8E9FUTpbvc`

Pestañas leídas en modo solo lectura:
- `Marcas Potenciales` (8 columnas)
- `Marcas Colaboradas` (8 columnas)
- `Grupos empresariales` (4 columnas)
- `Notas y Estrategia` (columnas A:B)

## Despliegue del endpoint
1. Abrir la hoja original en Google Sheets.
2. Extensiones → Apps Script.
3. Sustituir el contenido de `Code.gs` por el archivo de esta carpeta.
4. Guardar el proyecto.
5. Configuración del proyecto: zona horaria `Europe/Madrid`.
6. Implementar → Nueva implementación → Aplicación web.
7. Ejecutar como: la cuenta propietaria de la hoja.
8. Quién tiene acceso: Cualquier usuario.
9. Implementar y copiar la URL terminada en `/exec`.

El endpoint solo hace lecturas con `SpreadsheetApp`. No contiene ninguna operación de escritura, edición, borrado ni ordenación.

## Privacidad
La aplicación web pública permite consultar los datos que devuelve el endpoint. El dashboard actual ya publica información de marcas, contactos y notas en GitHub Pages. Antes de desplegar, confirma que quieres mantener públicamente accesibles esos mismos campos.

## Contrato JSON
La respuesta contiene:
- `potential`: registros de Marcas Potenciales.
- `collaborated`: registros de Marcas Colaboradas.
- `groups`: relaciones de Grupos empresariales.
- `strategy`: contenido de Notas y Estrategia.
- `counts` y `generatedAt`.

También admite JSONP mediante `?callback=nombreFuncion` para evitar problemas CORS en GitHub Pages.

## Compatibilidad con Grok
No cambiar los nombres de pestañas, encabezados, orden de columnas ni el orden de filas de `Marcas Potenciales`. Grok selecciona prospectos de arriba abajo y actualiza las filas existentes. El endpoint no escribe en la hoja.

## Observaciones detectadas en la copia Excel
- Hay 358 marcas con nombre en Marcas Potenciales.
- Hay una fórmula matricial en H2 de Marcas Potenciales cuyo valor exportado aparece como `#REF!`. El endpoint omite ese error en el campo Grupo empresarial; no modifica la fórmula.
- Las 56 filas de Grupos empresariales tienen fórmulas en la columna C. Apps Script leerá su valor visible calculado en Google Sheets.
- La copia Excel no es la fuente de verdad; la lectura de producción será directamente desde el Google Sheet original.

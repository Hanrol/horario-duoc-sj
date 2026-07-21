# Armador de horario — Duoc UC San Joaquín

Página estática para armar horarios con los datos del Excel de oferta académica del 2.º semestre de 2026 de la sede San Joaquín.

## Funciones

- Filtros por carrera, jornada, nivel y bloque horario.
- Jornadas sin ramos deshabilitadas según la carrera seleccionada.
- Búsqueda por nombre o sigla de asignatura y por profesor.
- Selección de secciones, detección de choques y guardado local.
- Enlace compartible con las secciones seleccionadas.
- Exclusión de filas `00:00–00:00` y agrupación de duplicados por plan sin mezclar siglas distintas.
- Diseño basado en colores institucionales y tipografías Merriweather + Lato.

## Probar localmente

Desde la carpeta del proyecto:

```powershell
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Publicar con GitHub Pages

1. Crea un repositorio y sube todos los archivos de esta carpeta a la raíz.
2. En GitHub entra a `Settings > Pages` y en `Build and deployment` selecciona `Deploy from a branch`.
3. Elige la rama `main`, carpeta `/ (root)` y guarda. GitHub mostrará la dirección pública cuando termine el despliegue.

No requiere backend, base de datos ni variables de entorno.

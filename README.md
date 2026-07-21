<div align="center">

# Armador de Horario

### Duoc UC · Sede San Joaquín · 2.º semestre de 2026

Planificador web para buscar asignaturas, comparar secciones y construir un horario sin choques.
Se encuentra alojada en ```text booterman98.github.io/malla-interactiva ```

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=111)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=flat-square&logo=github&logoColor=white)

</div>

---

## Descripción

**Armador de Horario** es una página estática que utiliza la oferta académica de Duoc UC, sede San Joaquín, correspondiente al **semestre actual (2026-2)**.

Permite filtrar los ramos disponibles, revisar sus secciones y profesores, agregarlos a un calendario semanal y detectar cruces de horario antes de realizar la inscripción oficial.

## Funciones principales

- Filtro por carrera, jornada, nivel y bloque horario.
- Búsqueda por nombre de asignatura, sigla o profesor.
- Visualización de todas las secciones disponibles.
- Reemplazo automático al escoger otra sección del mismo ramo.
- Detección de choques entre clases.
- Vista semanal para escritorio.
- Vista diaria optimizada para celulares.
- Guardado automático del horario en el navegador.
- Enlaces para compartir una selección de secciones.
- Exportación del horario a PDF.

## Tecnologías

El proyecto funciona completamente en el navegador y no requiere backend ni base de datos.

```text
HTML
CSS
JavaScript
JSON
GitHub Pages
```

## Estructura del proyecto

```text
horario-duoc-san-joaquin/
├── data/
│   └── horarios.json
├── .nojekyll
├── app.js
├── index.html
├── README.md
└── styles.css
```

## Ejecutar localmente

No se recomienda abrir `index.html` directamente, porque algunos navegadores bloquean la lectura del archivo JSON local.

Desde la carpeta del proyecto, ejecuta:

```powershell
python -m http.server 8000
```

Luego abre en el navegador:

```text
http://localhost:8000
```

## Fuente de datos

Los datos fueron procesados desde el archivo de oferta académica de la sede San Joaquín para el período **2026-002**.

Durante el procesamiento:

- Se agruparon los bloques pertenecientes a una misma sección.
- Se descartaron registros sin horario definido.
- Se eliminaron duplicados producidos por planes académicos.
- Se mantuvieron separadas las asignaturas con siglas diferentes.

## Actualización de datos

La página corresponde únicamente al período **2026-2**. Para utilizarla en otro semestre es necesario procesar nuevamente el Excel oficial y reemplazar:

```text
data/horarios.json
```

## Aviso

Este es un proyecto independiente y **no corresponde a una plataforma oficial de Duoc UC**.

La información puede sufrir modificaciones. Antes de inscribir asignaturas, los horarios deben verificarse en los sistemas institucionales.

---

<div align="center">

Proyecto para estudiantes de Duoc UC · Sede San Joaquín

</div>
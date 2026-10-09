# Columna NRO + reportes PDF/Excel (08/10/2026)

## Qué cambia (solo frontend, sin base de datos)
- Columna **Nro** antes de Alumno (numeración de las filas visibles).
- Botones **Reporte PDF** y **Reporte Excel** arriba a la derecha.
- Ambos reportes salen en **tamaño Carta vertical** e incluyen: Nro, Alumno,
  Curso, Estado, Inscrito. Respetan los filtros aplicados (nombre/curso).

## Pasos
1. Copia el archivo en tu proyecto (sobrescribir):
   src/features/alumnos/pages/AlumnosPage.tsx
2. Instala dependencias (si aún no las tienes):
   npm install
   (usa jspdf, jspdf-autotable y xlsx, ya declaradas en package.json)
3. Comandos git (uno por uno):
   git add .
   git commit -m "Columna Nro y reportes PDF Excel en Alumnos"
   git push

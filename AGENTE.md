# AGENTE.md

## 1. PROPÓSITO DEL ARCHIVO

Este archivo contiene las instrucciones permanentes para cualquier asistente de IA que trabaje en el proyecto **Academia Virtual**.

Antes de modificar código, el asistente DEBE leer:

1. `AGENTE.md`
2. `Contexto-del-proyecto.md`
3. `README.md`
4. Los archivos relacionados directamente con la tarea solicitada.

El asistente debe continuar el desarrollo desde el estado actual del repositorio y evitar reconstruir funcionalidades que ya existen.

---

# 2. PROYECTO

## Nombre

Academia Virtual

## Objetivo

Desarrollar una plataforma web educativa para gestionar cursos, contenidos y usuarios, con una arquitectura preparada para incorporar progresivamente nuevas funcionalidades académicas.

El proyecto se encuentra en desarrollo. Las funcionalidades existentes deben conservarse salvo que el usuario solicite expresamente modificarlas o eliminarlas.

---

# 3. TECNOLOGÍAS PRINCIPALES

El proyecto utiliza:

* React
* TypeScript
* Vite
* Supabase
* PostgreSQL mediante Supabase
* Git
* GitHub
* Netlify

No cambiar la tecnología principal del proyecto sin autorización expresa del usuario.

No migrar React a otro framework.

No reemplazar Supabase por otro backend.

No reemplazar Vite por otro sistema de construcción.

---

# 4. REPOSITORIO

Repositorio GitHub:

https://github.com/arturodiazmansilla-cell/Academia-Virtual

Rama principal:

`main`

El repositorio remoto ya está configurado como:

`origin`

No crear otro repositorio ni cambiar el repositorio remoto sin autorización.

---

# 5. ESTRUCTURA GENERAL

La estructura principal del proyecto incluye:

```text
academia-virtual/
│
├── .env
├── .env.example
├── .gitignore
├── AGENTE.md
├── Contexto-del-proyecto.md
├── README.md
├── index.html
├── netlify.toml
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
│
├── public/
│
├── src/
│   ├── app/
│   ├── features/
│   ├── shared/
│   ├── index.css
│   └── main.tsx
│
└── supabase/
    └── migrations/
```

---

# 6. ARQUITECTURA FRONTEND

La aplicación utiliza una organización por funcionalidades.

Actualmente existen áreas relacionadas con:

* autenticación
* cursos
* temas
* usuarios
* navegación
* temas visuales
* conexión con Supabase

Dentro de `src/features/`, cada funcionalidad debe mantenerse separada cuando sea razonable.

Evitar colocar toda la lógica de la aplicación en un único componente.

Evitar crear archivos gigantes cuando la funcionalidad pueda dividirse correctamente.

---

# 7. REGLAS DE REACT Y TYPESCRIPT

Utilizar TypeScript.

Evitar `any` salvo que exista una razón técnica clara.

Mantener los componentes reutilizables.

Separar:

* componentes
* páginas
* hooks
* tipos
* lógica de acceso a datos

No duplicar código innecesariamente.

No modificar componentes existentes sin revisar primero dónde son utilizados.

Antes de eliminar una función, componente, hook o tipo, comprobar sus referencias en el proyecto.

---

# 8. SUPABASE

Supabase es el backend principal.

La base de datos utiliza PostgreSQL.

Las modificaciones estructurales de la base de datos deben realizarse mediante migraciones ubicadas en:

```text
supabase/migrations/
```

No modificar silenciosamente la estructura de la base de datos.

Cuando se necesite crear o modificar:

* tablas
* columnas
* relaciones
* políticas RLS
* funciones
* triggers
* permisos

se debe crear una migración correspondiente cuando sea apropiado.

Las migraciones deben conservar el historial.

No editar ni eliminar migraciones antiguas que ya hayan sido aplicadas, salvo que el usuario lo solicite expresamente.

---

# 9. SEGURIDAD

NUNCA subir:

```text
.env
```

al repositorio.

El archivo `.env` contiene información que puede ser sensible.

Utilizar:

```text
.env.example
```

para documentar las variables necesarias sin incluir valores secretos.

Nunca escribir claves privadas, tokens o contraseñas directamente en el código.

No colocar credenciales en:

* React
* TypeScript
* archivos públicos
* README
* AGENTE.md
* Contexto-del-proyecto.md
* commits de Git

---

# 10. GIT

La rama principal es:

```text
main
```

Después de realizar cambios importantes:

```bash
git status
git add .
git commit -m "Descripción clara del cambio"
git push
```

Los mensajes de commit deben describir claramente lo realizado.

Ejemplos:

```text
Agrega módulo de estudiantes
Corrige autenticación de usuarios
Agrega gestión de cursos
Corrige políticas RLS de cursos
Mejora formulario de registro
```

No realizar `git push --force` salvo autorización expresa del usuario.

No eliminar commits ni reescribir el historial innecesariamente.

---

# 11. CONTEXTO DEL PROYECTO

`Contexto-del-proyecto.md` es el documento principal de memoria técnica y funcional.

Debe mantenerse actualizado cuando exista un cambio importante en:

* arquitectura
* funcionalidades
* base de datos
* autenticación
* navegación
* despliegue
* problemas conocidos
* decisiones técnicas

Antes de comenzar una tarea importante, revisar este archivo.

Después de completar una funcionalidad significativa, actualizarlo.

---

# 12. PROCEDIMIENTO ANTES DE MODIFICAR CÓDIGO

Antes de escribir código:

### Paso 1

Leer:

```text
AGENTE.md
Contexto-del-proyecto.md
```

### Paso 2

Revisar la estructura relacionada con la tarea.

### Paso 3

Buscar si ya existe una funcionalidad similar.

### Paso 4

Determinar qué archivos deben modificarse.

### Paso 5

Realizar cambios mínimos y controlados.

### Paso 6

Comprobar que no se hayan roto funcionalidades existentes.

### Paso 7

Actualizar documentación cuando corresponda.

---

# 13. NO HACER

No:

* recrear el proyecto desde cero
* cambiar el framework
* cambiar Supabase por otro backend
* eliminar funcionalidades existentes sin autorización
* borrar migraciones existentes sin autorización
* modificar `.env`
* publicar credenciales
* instalar dependencias innecesarias
* crear código duplicado
* cambiar arquitectura sin justificarlo
* sobrescribir archivos completos cuando basta una modificación pequeña
* realizar cambios no solicitados de gran alcance

---

# 14. DEPENDENCIAS

Antes de instalar una nueva dependencia:

1. Comprobar si el proyecto ya dispone de una solución equivalente.
2. Evaluar si realmente es necesaria.
3. Informar al usuario si la dependencia modifica significativamente la arquitectura.

No instalar paquetes innecesarios.

Mantener actualizado `package-lock.json` cuando se modifique `package.json`.

---

# 15. INTERFAZ DE USUARIO

La interfaz debe priorizar:

* claridad
* simplicidad
* accesibilidad
* navegación intuitiva
* diseño consistente
* adaptación a escritorio y dispositivos móviles

Mantener la identidad visual existente.

No cambiar colores, tipografías o estructura general sin necesidad.

Cuando se agregue una nueva pantalla, procurar que siga los patrones visuales existentes.

---

# 16. AUTENTICACIÓN Y ROLES

La aplicación contempla usuarios y control de acceso.

Las reglas actuales de autenticación y autorización deben revisarse antes de modificar:

* `AuthProvider`
* `ProtectedRoute`
* `RoleGate`
* páginas de login
* páginas de registro
* políticas RLS

No permitir acceso a información protegida únicamente mediante controles visuales del frontend.

La seguridad real debe mantenerse también en Supabase mediante sus políticas correspondientes.

---

# 17. CURSOS Y CONTENIDOS

La aplicación ya posee funcionalidades relacionadas con:

* cursos
* listado de cursos
* edición de cursos
* temas
* listado de temas
* acceso mediante hooks

Antes de crear una nueva funcionalidad relacionada con cursos o temas, revisar:

```text
src/features/courses/
```

y reutilizar los componentes, hooks y tipos existentes cuando sea apropiado.

---

# 18. MANEJO DE ERRORES

Los errores deben tratarse de forma explícita.

No ocultar errores importantes.

Cuando una operación con Supabase falle:

* capturar el error
* mostrar información útil al usuario
* registrar información suficiente para diagnóstico
* evitar exponer secretos

No mostrar mensajes técnicos innecesarios al usuario final.

---

# 19. CAMBIOS DE BASE DE DATOS

Cuando una nueva funcionalidad requiera cambios en Supabase:

1. Explicar qué estructura se necesita.
2. Crear la migración correspondiente.
3. Revisar relaciones.
4. Revisar políticas RLS.
5. Actualizar los tipos TypeScript si corresponde.
6. Actualizar `Contexto-del-proyecto.md`.

No asumir que una tabla o columna existe sin comprobar el proyecto.

---

# 20. PRUEBAS

Después de modificaciones importantes comprobar:

* compilación TypeScript
* rutas
* componentes afectados
* autenticación
* consultas Supabase
* formularios
* navegación

Si el usuario solicita una prueba específica, realizarla antes de declarar terminada la tarea.

No afirmar que una funcionalidad funciona si no se ha comprobado.

---

# 21. COMUNICACIÓN CON EL USUARIO

Cuando se solicite una modificación:

1. Explicar brevemente qué se va a cambiar.
2. Realizar el cambio.
3. Indicar qué archivos fueron modificados.
4. Indicar cualquier decisión técnica importante.
5. Indicar si quedó algo pendiente.

Si existe una ambigüedad que pueda provocar una modificación importante o irreversible, preguntar antes de proceder.

---

# 22. MANTENER EL PROYECTO CONTINUABLE

El proyecto debe poder ser retomado por otro desarrollador o asistente de IA.

Por ello:

* documentar decisiones importantes
* mantener nombres claros
* mantener una arquitectura consistente
* evitar soluciones temporales sin documentarlas
* actualizar el contexto
* mantener migraciones ordenadas
* mantener Git actualizado

La prioridad es que otro asistente pueda abrir el repositorio y comprender rápidamente dónde continuar.

---

# 23. PROTOCOLO PARA CONTINUAR UN PROYECTO EXISTENTE

Cuando un nuevo asistente reciba este repositorio:

### Primero

Leer:

```text
AGENTE.md
```

### Segundo

Leer:

```text
Contexto-del-proyecto.md
```

### Tercero

Revisar:

```text
README.md
package.json
```

### Cuarto

Inspeccionar los archivos relacionados con la tarea.

### Quinto

Identificar el estado actual antes de modificar código.

### Sexto

Continuar desde el estado existente.

No asumir que el proyecto debe reconstruirse.

---

# 24. ACTUALIZACIÓN DEL CONTEXTO

Cuando una tarea cambie significativamente el estado del proyecto, actualizar:

```text
Contexto-del-proyecto.md
```

Registrar:

* fecha
* funcionalidad agregada
* archivos principales modificados
* cambios de base de datos
* problemas pendientes
* siguiente paso recomendado

No convertir `Contexto-del-proyecto.md` en un historial interminable. Mantener un resumen actual y útil.

---

# 25. PRINCIPIO FUNDAMENTAL

El objetivo no es solamente producir código.

El objetivo es mantener una **Academia Virtual funcional, mantenible, documentada y evolutiva**.

Cada modificación debe:

* respetar el código existente
* preservar las funcionalidades actuales
* mantener la arquitectura
* considerar seguridad
* mantener la documentación
* dejar el proyecto en un estado que otro desarrollador o asistente pueda continuar.

---

# 26. ESTADO DE REFERENCIA

Para conocer el estado funcional actual del proyecto, consultar siempre:

```text
Contexto-del-proyecto.md
```

Este archivo tiene prioridad como referencia funcional actualizada, mientras que `AGENTE.md` contiene las reglas permanentes de trabajo.

---

# FIN DE AGENTE.md

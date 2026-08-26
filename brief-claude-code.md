# La Juntada — Brief para revisión y mejora (handoff a Claude Code)

Te paso el archivo `index.html` de una app web que vengo desarrollando. Quiero que **primero la audites y me propongas mejoras**, sin cambiar nada todavía. Acá tenés todo el contexto.

---

## 1. Qué es

**La Juntada — "Cuentas claras conservan la amistad".** Una app web simple para organizar y dividir los gastos de una juntada/asado entre amigos, pensada para Argentina: pesos argentinos, formato `es-AR` (ej. $138.681), y la lógica real de una juntada (asado, fernet, los que no toman alcohol, el que pone la plata, el postre, etc.).

## 2. Estado técnico actual

- **Un único archivo `index.html` autocontenido**: HTML + CSS + JS puro (vanilla), sin librerías ni paso de build. ~850 líneas.
- **Mobile-first**, pensada para usarse en el celular al lado de la parrilla.
- Persistencia en **localStorage** del navegador (no hay backend).
- **Estático puro**: se publica en GitHub → Vercel sin configuración. Tiene meta tags para "Agregar a pantalla de inicio" en el celular.

## 3. Estructura conceptual (todo en un archivo, pero separable en 3 capas)

- **Datos/estado**: un objeto `state` (`people`, `items`, `rounding`, `rules`, config del planificador) + `localStorage`.
- **Lógica**: `compute()` (reparto justo), `settle()` (saldar deudas, algoritmo greedy), `PLAN_TYPES` (cantidades del planificador).
- **Presentación**: funciones `render*()` que dibujan la UI y reaccionan a los eventos.

## 4. Pantallas y funciones

**Bienvenida** (siempre al abrir): logo, lema, descripción, botón "Crear una juntada" → Planificar, y el historial de juntadas guardadas abajo (se abren con un toque).

**Planificar** ("¿cuánto compro?"): se elige el tipo de juntada (asado, choripán, bebidas, pizza, empanadas, pizza+empanadas, pastas, picada, otras) y cuántos son. Tiene:
- Toggle **hombres/mujeres** (porciones distintas por género, con una aclaración respetuosa de por qué).
- Toggles **incluir bebida** e **incluir postre** en la lista.
- Lista de cantidades sugeridas, **editable** (botones −/+ por ítem y × para sacarlo).
- Botón "Copiar lista para el súper" (texto para WhatsApp) y "Omitir" (saltar a Dividir).
- Botón "Cargar estas personas en Dividir".

**Dividir** (el corazón): 
- **Personas**: nombre, tilde 🍺 toma, tilde 🧁 postre, y alias/CBU opcional.
- **Gastos**: cada ítem con nombre, precio, categoría (Comida / Bebida / Postre / Extras) y "quién pagó".
- **Reparto justo** (ver lógica abajo) con tarjetas por categoría.
- **Cómo saldar**: quién le transfiere a quién y cuánto.
- **Redondeo** opcional a $500 / $1.000 para pagar en efectivo.
- Botones **Compartir link** (codifica los datos en la URL) y **WhatsApp** (resumen de texto).
- **Guardar juntada** en el historial.

**Reglas**: 4 "reglas de oro" predeterminadas (etiqueta de la juntada) editables; cada uno agrega/borra las suyas.

## 5. Lógica de cálculo (lo crítico — no romper)

```
comidaShare  = totalComida  / nPersonas          (entre todos)
extrasShare  = totalExtras  / nPersonas          (entre todos)
bebidaShare  = totalBebida  / nQueToman          (solo los que tildan 🍺)
postreShare  = totalPostre  / nQueComenPostre    (solo los que tildan 🧁)

parte(persona) = comidaShare + extrasShare
               + (toma   ? bebidaShare : 0)
               + (postre ? postreShare : 0)

pagó(persona)    = suma de los ítems donde figura como pagador
balance(persona) = pagó - parte
```

- **Saldar** (`settle`): algoritmo greedy que cruza deudores (balance negativo) con acreedores (balance positivo) y genera transferencias "X → $Y → Z".
- Si nadie tilda una categoría de consumo (bebida o postre), por seguridad se reparte entre todos.
- **Redondeo** opcional: la parte de cada uno se redondea a múltiplos de $500/$1.000 (aproximado, puede sobrar/faltar algún peso).

### Cantidades del planificador (editables, son aproximadas)
- Asado: carne 500 g (H) / 400 g (M) por persona; chorizos 1 c/u; achuras 100 g c/u; ensalada 200 g c/u; pan 150 g c/u; carbón = kg de carne + 1; picada (salame, queso, snacks); gaseosa 1 botella de 2,5 L cada 3.
- Choripán: 2 choripanes por persona; lechuga 100 g; tomate ½ c/u; picada; carbón; gaseosa.
- Bebidas: cerveza ½ L c/u; gaseosa 1 botella 2,5 L cada 3; fernet ~125 ml c/u; hielo ¼ kg c/u.
- Pizza: 4 porciones (H) / 3 (M), 8 porciones por pizza; + picada; gaseosa.
- Empanadas: 6 (H) / 4 (M) por persona; + picada; gaseosa.
- Pastas, picada, otras: cantidades análogas.

## 6. Decisiones de diseño tomadas (respetar el espíritu)

- **Single-file, sin dependencias, deployable como estático.** Esto es a propósito (simple, rápido de publicar).
- **Una sola pantalla por pestaña**, con el resultado actualizándose en vivo (decidimos NO separar el reparto en otra pestaña, para no perder el feedback inmediato).
- Las categorías de consumo (bebida, postre) se reparten **solo entre quienes consumen** — esa es la justicia que diferencia a la app de un Splitwise genérico.
- Tono y copy en español rioplatense, cálido.

## 7. Lo que quiero de vos (Claude Code)

**Primero: AUDITÁ y entregá un informe con mejoras propuestas. NO cambies código todavía.** Cubrí estos ángulos:

1. **Calidad y organización del código**: legibilidad, duplicación, funciones largas, posibles bugs o edge cases (sobre todo en `compute`/`settle` con divisiones por cero, sin personas, sin gastos, decimales).
2. **Arquitectura**: ¿conviene separar en archivos (datos / lógica / UI)? ¿Mantener vanilla o introducir un build/framework? Dame pros y contras **para este caso concreto** (app chica, estática, deploy en Vercel).
3. **UX/UI y accesibilidad**: a11y (navegación por teclado, roles ARIA, lectores de pantalla), contraste, tamaños de toque en mobile.
4. **Robustez**: manejo de datos inválidos, errores, y que el reparto cierre siempre exacto.
5. **Seguridad**: escape de HTML (XSS), datos en localStorage y en la URL de "compartir".
6. **Testing**: qué tests agregarías; la lógica de `compute`/`settle` es lo más importante para cubrir.
7. **PWA**: ¿vale la pena hacerla instalable de verdad (manifest + service worker para uso offline)?

**Después del informe, esperá mi OK y aplicamos los cambios por partes**, con git (commits chicos y reversibles), manteniendo la app **100% funcional y deployable en Vercel en cada paso**. No quiero un big-bang que reescriba todo de una.

Empezá por el informe.

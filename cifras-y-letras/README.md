# Cifras y Letras

Réplica web del concurso "Cifras y Letras" (RTVE), jugable a 1 o 2 jugadores.

## Cómo jugar

Abre `index.html` en el navegador (recomendado servirlo con un servidor local,
por ejemplo `npx serve .`, para evitar restricciones de `fetch` en `file://`).

- Elige modo de 1 o 2 jugadores, los nombres y el número de pruebas.
- **Rondas de letras**: pide vocales o consonantes hasta completar 9 letras y
  escribe la palabra más larga posible. Las palabras se validan consultando
  el [Diccionario de la RAE](https://dle.rae.es) en tiempo real.
- **Rondas de números**: elige cuántos números grandes (25, 50, 75, 100)
  quieres entre los 6 números, y combínalos con `+ - * /` y paréntesis para
  acercarte al número objetivo. Se muestra la mejor solución posible al acabar
  la prueba.
- Al final se muestra el marcador y el ganador.

## Notas técnicas

- Sin dependencias ni build: HTML + CSS + JS puro.
- La verificación de palabras usa un proxy CORS (`allorigins.win`) para poder
  consultar `dle.rae.es` desde el navegador. Si no hay conexión o el proxy no
  responde, se avisa para que los jugadores adjudiquen la palabra manualmente.
- El solver de la prueba de números implementa el algoritmo clásico de
  combinación de pares (búsqueda de la mejor aproximación al objetivo).

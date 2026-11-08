'use strict';

/* =========================================================
   ESTADO GLOBAL
========================================================= */
const state = {
  numPlayers: 1,
  playerNames: ['Jugador 1', 'Jugador 2'],
  totalRounds: 6,
  round: 0,
  roundTypes: [],
  scores: [0, 0],
  timer: null,
  timeLeft: 0,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  $(`#${id}`).classList.add('active');
}

function renderScoreboard() {
  const board = $('#scoreboard');
  board.innerHTML = '';
  for (let i = 0; i < state.numPlayers; i++) {
    const chip = document.createElement('div');
    chip.className = 'score-chip';
    chip.innerHTML = `${state.playerNames[i]}<span class="val">${state.scores[i]}</span>`;
    board.appendChild(chip);
  }
}

/* =========================================================
   SETUP SCREEN
========================================================= */
$$('#screen-setup .choice-row .choice-btn[data-players]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.choice-btn[data-players]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.numPlayers = parseInt(btn.dataset.players, 10);
    $('#p2-name').classList.toggle('hidden', state.numPlayers !== 2);
  });
});

$$('#rounds-row .choice-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('#rounds-row .choice-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.totalRounds = parseInt(btn.dataset.rounds, 10);
  });
});

$('#start-btn').addEventListener('click', () => {
  state.playerNames[0] = $('#p1-name').value.trim() || 'Jugador 1';
  state.playerNames[1] = $('#p2-name').value.trim() || 'Jugador 2';
  state.scores = [0, 0];
  state.round = 0;
  state.roundTypes = buildRoundSequence(state.totalRounds);
  renderScoreboard();
  nextRound();
});

$('#restart-btn').addEventListener('click', () => {
  showScreen('screen-setup');
});

function buildRoundSequence(n) {
  // Alterna letras/números empezando por letras, como en el programa clásico.
  const seq = [];
  for (let i = 0; i < n; i++) seq.push(i % 2 === 0 ? 'letters' : 'numbers');
  return seq;
}

function nextRound() {
  if (state.round >= state.totalRounds) {
    return showFinal();
  }
  const type = state.roundTypes[state.round];
  state.round++;
  if (type === 'letters') startLettersRound();
  else startNumbersRound();
}

/* =========================================================
   RONDA DE LETRAS
========================================================= */
const VOWELS = { A: 12, E: 12, O: 9, I: 6, U: 5 };
const CONSONANTS = {
  S: 6, N: 5, R: 5, L: 4, T: 4, C: 4, D: 5, M: 2, P: 2,
  B: 2, G: 2, V: 1, Y: 1, Q: 1, H: 2, F: 1, Z: 1, J: 1, Ñ: 1,
};

let lettersRoundState = null;

function weightedRandom(table) {
  const entries = Object.entries(table);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [letter, w] of entries) {
    if (r < w) return letter;
    r -= w;
  }
  return entries[0][0];
}

function startLettersRound() {
  lettersRoundState = { letters: [], vowelCount: 0, consonantCount: 0 };
  $('#letters-round-num').textContent = `${state.round}/${state.totalRounds}`;
  $('#letter-tiles').innerHTML = '';
  $('#letters-play-area').classList.add('hidden');
  $('#letters-results').classList.add('hidden');
  $('#letters-results').innerHTML = '';
  $('#letters-next-btn').classList.add('hidden');
  $('#letters-draw-controls').classList.remove('hidden');
  $('#btn-vocal').disabled = false;
  $('#btn-consonante').disabled = false;
  clearTimer();
  showScreen('screen-letters');
}

function drawLetter(kind) {
  if (lettersRoundState.letters.length >= 9) return;
  // Máximo 5 vocales / 6 consonantes, como en el programa (con margen razonable).
  let letter;
  if (kind === 'vocal') {
    letter = weightedRandom(VOWELS);
    lettersRoundState.vowelCount++;
  } else {
    letter = weightedRandom(CONSONANTS);
    lettersRoundState.consonantCount++;
  }
  lettersRoundState.letters.push({ letter, kind });
  renderLetterTiles();

  if (lettersRoundState.letters.length >= 9) {
    finishLetterDraw();
  } else {
    // Bloquea el tipo si ya se alcanzó su límite razonable.
    $('#btn-vocal').disabled = lettersRoundState.vowelCount >= 5;
    $('#btn-consonante').disabled = lettersRoundState.consonantCount >= 6;
  }
}

$('#btn-vocal').addEventListener('click', () => drawLetter('vocal'));
$('#btn-consonante').addEventListener('click', () => drawLetter('consonante'));

function renderLetterTiles() {
  const wrap = $('#letter-tiles');
  wrap.innerHTML = '';
  lettersRoundState.letters.forEach(({ letter, kind }) => {
    const t = document.createElement('div');
    t.className = `tile ${kind === 'vocal' ? 'vowel' : 'consonant'}`;
    t.textContent = letter;
    wrap.appendChild(t);
  });
}

function finishLetterDraw() {
  $('#letters-draw-controls').classList.add('hidden');
  $('#letters-play-area').classList.remove('hidden');
  buildPlayerInputs('letters-inputs', 'Escribe la palabra más larga que puedas formar');
  startTimer(30, 'letters', () => onLettersTimeUp());
}

function buildPlayerInputs(containerId, placeholder) {
  const wrap = $(`#${containerId}`);
  wrap.innerHTML = '';
  for (let i = 0; i < state.numPlayers; i++) {
    const card = document.createElement('div');
    card.className = 'player-input-card';
    card.innerHTML = `
      <label>${state.playerNames[i]}</label>
      <input type="text" id="${containerId}-p${i}" placeholder="${placeholder}" autocomplete="off">
    `;
    wrap.appendChild(card);
  }
}

function onLettersTimeUp() {
  $$('#letters-inputs input').forEach((inp) => (inp.disabled = true));
  checkLetters();
}

$('#letters-check-btn').addEventListener('click', () => {
  clearTimer();
  $$('#letters-inputs input').forEach((inp) => (inp.disabled = true));
  checkLetters();
});

function normalize(str) {
  return str.trim().toUpperCase();
}

function wordUsesOnlyDrawnLetters(word, letters) {
  const pool = {};
  letters.forEach(({ letter }) => (pool[letter] = (pool[letter] || 0) + 1));
  for (const ch of word) {
    if (!pool[ch]) return false;
    pool[ch]--;
  }
  return true;
}

async function checkLetters() {
  const resultsWrap = $('#letters-results');
  resultsWrap.innerHTML = '<p>Consultando el Diccionario de la RAE...</p>';
  resultsWrap.classList.remove('hidden');

  const letters = lettersRoundState.letters;
  const entries = [];
  for (let i = 0; i < state.numPlayers; i++) {
    const raw = $(`#letters-inputs-p${i}`).value;
    const word = normalize(raw);
    entries.push({ playerIndex: i, word });
  }

  resultsWrap.innerHTML = '';
  for (const entry of entries) {
    const card = document.createElement('div');
    card.className = 'result-card';
    resultsWrap.appendChild(card);

    if (!entry.word) {
      card.classList.add('invalid');
      card.innerHTML = `<span class="name">${state.playerNames[entry.playerIndex]}</span><span class="points">0 pts</span>
        <div class="verdict">Sin palabra</div>`;
      continue;
    }

    const usesLetters = wordUsesOnlyDrawnLetters(entry.word, letters);
    let raeResult = { checked: false, valid: false, definition: '' };
    if (usesLetters) {
      card.innerHTML = `<span class="name">${state.playerNames[entry.playerIndex]}</span>
        <div class="verdict">Comprobando "${entry.word}" en la RAE...</div>`;
      raeResult = await checkWordInRAE(entry.word);
    }

    let points = 0;
    let verdictHtml = '';
    if (!usesLetters) {
      verdictHtml = `<div class="verdict">✗ "${entry.word}" no se puede formar con las letras disponibles</div>`;
      card.classList.add('invalid');
    } else if (raeResult.checked && raeResult.valid) {
      points = entry.word.length + (entry.word.length === 9 ? 5 : 0);
      verdictHtml = `<div class="verdict">✓ "${entry.word}" es válida (RAE)</div>`;
      if (raeResult.definition) {
        verdictHtml += `<div class="rae-def">${raeResult.definition}</div>`;
      }
      card.classList.add('valid');
    } else if (raeResult.checked && !raeResult.valid) {
      verdictHtml = `<div class="verdict">✗ "${entry.word}" no aparece en el Diccionario de la RAE</div>`;
      card.classList.add('invalid');
    } else {
      verdictHtml = `<div class="verdict">⚠ No se pudo consultar la RAE (sin conexión). Revisad la palabra manualmente.</div>`;
    }

    card.innerHTML = `<span class="name">${state.playerNames[entry.playerIndex]}</span><span class="points">${points} pts</span>
      ${verdictHtml}`;
    state.scores[entry.playerIndex] += points;
  }

  renderScoreboard();
  $('#letters-next-btn').classList.remove('hidden');
}

/* =========================================================
   VERIFICACIÓN CON LA RAE (dle.rae.es)
========================================================= */
const RAE_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/${url}`,
];

async function fetchWithFallbackProxies(url) {
  for (const buildProxyUrl of RAE_PROXIES) {
    try {
      const res = await fetch(buildProxyUrl(url), { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200) return text;
      }
    } catch (e) {
      /* prueba con el siguiente proxy */
    }
  }
  return null;
}

async function checkWordInRAE(word) {
  const url = `https://dle.rae.es/${encodeURIComponent(word.toLowerCase())}`;
  const html = await fetchWithFallbackProxies(url);
  if (!html) return { checked: false, valid: false, definition: '' };

  const notFound = /no est[aá] en el Diccionario/i.test(html);
  // Marcado habitual de dle.rae.es: definiciones en <p class="j">... dentro de <article>.
  const hasDefinitions = /class="j"/i.test(html) || /c-definitions/i.test(html) || /<article/i.test(html);

  if (notFound && !hasDefinitions) {
    return { checked: true, valid: false, definition: '' };
  }
  if (hasDefinitions && !notFound) {
    let def = '';
    const m = html.match(/<p class="j"[^>]*>([\s\S]*?)<\/p>/i)
      || html.match(/<p class="[^"]*def[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    if (m) {
      def = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
    }
    return { checked: true, valid: true, definition: def };
  }
  return { checked: false, valid: false, definition: '' };
}

$('#letters-next-btn').addEventListener('click', () => nextRound());

/* =========================================================
   RONDA DE NÚMEROS
========================================================= */
const LARGE_POOL = [25, 50, 75, 100];
const SMALL_POOL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

let numbersRoundState = null;

function startNumbersRound() {
  numbersRoundState = { numbers: [], target: null, largeChosen: null };
  $('#numbers-round-num').textContent = `${state.round}/${state.totalRounds}`;
  $('#number-tiles').innerHTML = '';
  $('#numbers-target-wrap').classList.add('hidden');
  $('#numbers-play-area').classList.add('hidden');
  $('#numbers-results').classList.add('hidden');
  $('#numbers-results').innerHTML = '';
  $('#numbers-next-btn').classList.add('hidden');
  $('#numbers-draw-controls').classList.remove('hidden');

  const row = $('#large-choice-row');
  row.innerHTML = '';
  for (let i = 0; i <= 4; i++) {
    const b = document.createElement('button');
    b.className = 'choice-btn';
    b.textContent = i === 0 ? 'Ninguno grande' : `${i} grande${i > 1 ? 's' : ''}`;
    b.addEventListener('click', () => chooseLargeCount(i));
    row.appendChild(b);
  }
  clearTimer();
  showScreen('screen-numbers');
}

function chooseLargeCount(count) {
  const largePool = shuffle([...LARGE_POOL]).slice(0, count);
  const smallPool = shuffle([...SMALL_POOL]).slice(0, 6 - count);
  const numbers = shuffle([...largePool, ...smallPool]);
  numbersRoundState.numbers = numbers;
  numbersRoundState.target = Math.floor(Math.random() * 899) + 101; // 101-999

  $('#numbers-draw-controls').classList.add('hidden');
  renderNumberTiles(numbers);
  $('#numbers-target-wrap').classList.remove('hidden');
  $('#target-number').textContent = numbersRoundState.target;

  $('#numbers-play-area').classList.remove('hidden');
  buildPlayerInputs('numbers-inputs', 'Ej: (25+3)*4-10');
  startTimer(45, 'numbers', () => onNumbersTimeUp());
}

function renderNumberTiles(numbers) {
  const wrap = $('#number-tiles');
  wrap.innerHTML = '';
  numbers.forEach((n) => {
    const t = document.createElement('div');
    t.className = `tile ${LARGE_POOL.includes(n) ? 'large-num' : 'small-num'}`;
    t.textContent = n;
    wrap.appendChild(t);
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function onNumbersTimeUp() {
  $$('#numbers-inputs input').forEach((inp) => (inp.disabled = true));
  checkNumbers();
}

$('#numbers-check-btn').addEventListener('click', () => {
  clearTimer();
  $$('#numbers-inputs input').forEach((inp) => (inp.disabled = true));
  checkNumbers();
});

/* ---- Evaluador seguro de expresiones aritméticas ---- */
function evaluateExpression(expr, available) {
  // Tokeniza
  const tokens = expr.match(/\d+(\.\d+)?|[()+\-*/]/g);
  if (!tokens) return { ok: false, error: 'Expresión vacía o inválida' };

  const usedNumbers = tokens.filter((t) => /^\d/.test(t)).map(Number);
  const pool = [...available];
  for (const n of usedNumbers) {
    const idx = pool.indexOf(n);
    if (idx === -1) return { ok: false, error: `El número ${n} no está entre los disponibles (o se usa más veces de las permitidas)` };
    pool.splice(idx, 1);
  }

  let pos = 0;
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }

  function parseExpr() {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const rhs = parseTerm();
      val = op === '+' ? val + rhs : val - rhs;
      if (val < 0) throw new Error('No se permiten resultados intermedios negativos');
    }
    return val;
  }
  function parseTerm() {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      const rhs = parseFactor();
      if (op === '/') {
        if (rhs === 0 || val % rhs !== 0) throw new Error('Las divisiones deben ser exactas');
        val = val / rhs;
      } else {
        val = val * rhs;
      }
    }
    return val;
  }
  function parseFactor() {
    if (peek() === '(') {
      next();
      const val = parseExpr();
      if (next() !== ')') throw new Error('Paréntesis desequilibrados');
      return val;
    }
    const t = next();
    if (t === undefined || !/^\d/.test(t)) throw new Error('Expresión inválida');
    return Number(t);
  }

  try {
    const result = parseExpr();
    if (pos !== tokens.length) throw new Error('Expresión inválida');
    return { ok: true, result, usedNumbers };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function checkNumbers() {
  const resultsWrap = $('#numbers-results');
  resultsWrap.innerHTML = '';
  resultsWrap.classList.remove('hidden');

  const { numbers, target } = numbersRoundState;

  for (let i = 0; i < state.numPlayers; i++) {
    const raw = $(`#numbers-inputs-p${i}`).value.trim();
    const card = document.createElement('div');
    card.className = 'result-card';
    resultsWrap.appendChild(card);

    if (!raw) {
      card.classList.add('invalid');
      card.innerHTML = `<span class="name">${state.playerNames[i]}</span><span class="points">0 pts</span>
        <div class="verdict">Sin respuesta</div>`;
      continue;
    }

    const evalResult = evaluateExpression(raw, numbers);
    let points = 0;
    let html = '';
    if (!evalResult.ok) {
      html = `<div class="verdict">✗ Operación no válida: ${evalResult.error}</div>`;
      card.classList.add('invalid');
    } else {
      const diff = Math.abs(evalResult.result - target);
      points = diff === 0 ? 10 : diff <= 5 ? 7 : diff <= 10 ? 5 : 0;
      const ok = points > 0;
      card.classList.add(ok ? 'valid' : 'invalid');
      html = `<div class="verdict">${ok ? '✓' : '✗'} ${raw} = ${evalResult.result} (diferencia de ${diff} respecto a ${target})</div>`;
    }

    card.innerHTML = `<span class="name">${state.playerNames[i]}</span><span class="points">${points} pts</span>${html}`;
    state.scores[i] += points;
  }

  const best = solveNumbers(numbers, target);
  if (best) {
    const box = document.createElement('div');
    box.className = 'solution-box';
    box.innerHTML = best.value === target
      ? `🎯 Solución exacta encontrada: <strong>${best.expr} = ${best.value}</strong>`
      : `💡 Mejor aproximación posible: <strong>${best.expr} = ${best.value}</strong> (diferencia de ${Math.abs(best.value - target)})`;
    resultsWrap.appendChild(box);
  }

  renderScoreboard();
  $('#numbers-next-btn').classList.remove('hidden');
}

$('#numbers-next-btn').addEventListener('click', () => nextRound());

/* ---- Solver clásico del juego de números (Countdown) ---- */
function solveNumbers(numbers, target) {
  let best = null;

  function consider(value, expr) {
    if (!Number.isInteger(value) || value <= 0) return;
    const diff = Math.abs(value - target);
    if (!best || diff < Math.abs(best.value - target)) {
      best = { value, expr };
    }
  }

  function recurse(items) {
    items.forEach((it) => consider(it.value, it.expr));
    if (best && best.value === target) return;

    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const a = items[i];
        const b = items[j];
        const rest = items.filter((_, idx) => idx !== i && idx !== j);
        const candidates = [];

        candidates.push({ value: a.value + b.value, expr: `(${a.expr}+${b.expr})` });
        if (a.value > b.value) candidates.push({ value: a.value - b.value, expr: `(${a.expr}-${b.expr})` });
        candidates.push({ value: a.value * b.value, expr: `(${a.expr}*${b.expr})` });
        if (b.value !== 0 && a.value % b.value === 0) {
          candidates.push({ value: a.value / b.value, expr: `(${a.expr}/${b.expr})` });
        }

        for (const c of candidates) {
          if (c.value <= 0 || !Number.isInteger(c.value)) continue;
          recurse([...rest, { value: c.value, expr: c.expr }]);
          if (best && best.value === target) return;
        }
      }
      if (best && best.value === target) return;
    }
  }

  const initial = numbers.map((n) => ({ value: n, expr: String(n) }));
  recurse(initial);
  if (best && best.expr.startsWith('(') && best.expr.endsWith(')')) {
    best.expr = best.expr.slice(1, -1);
  }
  return best;
}

/* =========================================================
   TEMPORIZADOR
========================================================= */
function startTimer(seconds, kind, onEnd) {
  clearTimer();
  state.timeLeft = seconds;
  const total = seconds;
  const bar = $(`#${kind}-timer-bar`);
  const text = $(`#${kind}-timer-text`);
  bar.style.width = '100%';
  bar.style.background = 'linear-gradient(90deg, #34d399, #f5b942)';
  text.textContent = seconds;

  state.timer = setInterval(() => {
    state.timeLeft--;
    text.textContent = state.timeLeft;
    const pct = Math.max(0, (state.timeLeft / total) * 100);
    bar.style.width = `${pct}%`;
    if (state.timeLeft <= 5) bar.style.background = 'linear-gradient(90deg, #ff5c5c, #ff9d5c)';
    if (state.timeLeft <= 0) {
      clearTimer();
      onEnd();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

/* =========================================================
   PANTALLA FINAL
========================================================= */
function showFinal() {
  clearTimer();
  const wrap = $('#final-scores');
  wrap.innerHTML = '';
  const maxScore = Math.max(...state.scores.slice(0, state.numPlayers));

  for (let i = 0; i < state.numPlayers; i++) {
    const card = document.createElement('div');
    const isWinner = state.scores[i] === maxScore && state.numPlayers > 1;
    card.className = `final-card${isWinner ? ' winner' : ''}`;
    card.innerHTML = `
      ${isWinner ? '<div class="crown">👑</div>' : ''}
      <div class="fname">${state.playerNames[i]}</div>
      <div class="fscore">${state.scores[i]}</div>
    `;
    wrap.appendChild(card);
  }

  $('#final-title').textContent = state.numPlayers === 1
    ? '¡Partida completada!'
    : (state.scores[0] === state.scores[1] ? '¡Empate!' : '¡Fin de la partida!');

  showScreen('screen-final');
}

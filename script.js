// ============================================
// DADOS DO JOGO
// ============================================

const items = [
  { word: 'PATO', syllables: ['PA', 'TO'], emoji: '🦆', category: 'Animal' },
  { word: 'GATO', syllables: ['GA', 'TO'], emoji: '🐱', category: 'Animal' },
  { word: 'CASA', syllables: ['CA', 'SA'], emoji: '🏠', category: 'Lugar' },
  { word: 'BOLA', syllables: ['BO', 'LA'], emoji: '⚽', category: 'Brinquedo' },
  { word: 'CARRO', syllables: ['CA', 'RRO'], emoji: '🚗', category: 'Transporte' },
  { word: 'MAÇÃ', syllables: ['MA', 'Ã'], emoji: '🍎', category: 'Fruta' },
  { word: 'SOL', syllables: ['SOL'], emoji: '☀️', category: 'Natureza' },
  { word: 'LIVRO', syllables: ['LI', 'VRO'], emoji: '📖', category: 'Objeto' },
  { word: 'ÁRVORE', syllables: ['ÁR', 'VO', 'RE'], emoji: '🌳', category: 'Natureza' },
  { word: 'TELEFONE', syllables: ['TE', 'LE', 'FO', 'NE'], emoji: '☎️', category: 'Objeto' },
  { word: 'SAPATO', syllables: ['SA', 'PA', 'TO'], emoji: '👟', category: 'Vestuário' },
  { word: 'MELANCIA', syllables: ['ME', 'LAN', 'CIA'], emoji: '🍉', category: 'Fruta' },
  { word: 'REFRIGERANTE', syllables: ['RE', 'FRI', 'GE', 'RAN', 'TE'], emoji: '🥤', category: 'Bebida' },
  { word: 'QUEIJO', syllables: ['QUEI', 'JO'], emoji: '🧀', category: 'Alimento' },
  { word: 'SORVETE', syllables: ['SOR', 'VE', 'TE'], emoji: '🍦', category: 'Alimento' }
];

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let deck = [];
let current;
let hidden = [];
let filled = new Map();
let round = 0;
let score = 0;
let errors = 0;
let demoTimers = [];
let gameStarted = false;

const letterNames = {
  A: 'á', B: 'bê', C: 'cê', D: 'dê', E: 'é', F: 'efe', G: 'gê', H: 'agá', I: 'i', J: 'jota',
  K: 'cá', L: 'ele', M: 'eme', N: 'ene', O: 'ó', P: 'pê', Q: 'quê', R: 'erre', S: 'esse', T: 'tê',
  U: 'u', V: 'vê', W: 'dáblio', X: 'xis', Y: 'ípsilon', Z: 'zê', Ç: 'cê cedilha', Ã: 'a com til'
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

const $ = (id) => document.getElementById(id);

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function speakText(text, rate = 0.82) {
  if (!('speechSynthesis' in window)) return;
  
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = rate;
  utterance.pitch = 1.06;
  speechSynthesis.speak(utterance);
}

function letterName(letter) {
  return letterNames[letter] || letter;
}

// ============================================
// SISTEMA DE JOGO
// ============================================

function start() {
  deck = shuffle(items);
  round = 0;
  score = 0;
  $('score').textContent = 0;
  load();
}

function load() {
  current = deck[round];
  filled.clear();
  errors = 0;
  updateAttempts();
  $('message').textContent = '';
  $('message').className = 'message';
  $('next').classList.remove('show');
  $('picture').textContent = current.emoji;
  $('picture').setAttribute('aria-label', 'Imagem: ' + current.word.toLowerCase());
  $('category').textContent = current.category;
  $('round').textContent = `Palavra ${round + 1} de ${deck.length}`;
  $('progress').style.width = `${(round / deck.length) * 100}%`;
  $('syllables').textContent = current.syllables.join(' • ');

  // Preparar as letras
  const chars = [...current.word];
  const possible = chars.map((_, i) => i);
  let count = Math.max(1, Math.ceil(chars.length * 0.5));
  hidden = shuffle(possible).slice(0, count).sort((a, b) => a - b);

  renderWord();

  // Preparar as opções
  const needed = hidden.map((i) => chars[i]);
  const extras = shuffle(ABC.filter((l) => !needed.includes(l))).slice(0, Math.max(2, 6 - needed.length));
  renderChoices(shuffle([...needed, ...extras]));

  if (gameStarted) {
    setTimeout(speakCurrent, 300);
  }
}

function speakCurrent() {
  if (!current) return;
  
  const parts = current.syllables.join('. ');
  const spelling = [...current.word].map(letterName).join('. ');
  speakText(
    `Observe a imagem. A palavra é ${current.word.toLowerCase()}. Vamos ler por sílabas. ${parts}. Agora vamos soletrar. ${spelling}. A palavra inteira é ${current.word.toLowerCase()}. Repita: ${current.word.toLowerCase()}.`,
    0.76
  );
}

function updateAttempts() {
  $('attempts').textContent =
    'Erros: ' +
    Array.from({ length: 3 }, (_, i) => (i < errors ? '✕' : '○')).join(' ');
}

function renderWord(wrongIndex = -1) {
  $('word').innerHTML = '';
  
  [...current.word].forEach((ch, i) => {
    const el = document.createElement('div');
    const isHidden = hidden.includes(i);
    
    el.className =
      'letter ' +
      (!isHidden ? 'shown' : filled.has(i) ? 'filled' : 'blank') +
      (i === wrongIndex ? ' wrong' : '');
    
    el.textContent = !isHidden ? ch : filled.get(i) || '';
    el.setAttribute(
      'aria-label',
      !isHidden ? `Letra ${ch}` : filled.has(i) ? `Letra ${filled.get(i)}` : 'Letra faltando'
    );
    
    $('word').appendChild(el);
  });
}

function renderChoices(letters) {
  $('choices').innerHTML = '';
  
  letters.forEach((letter, n) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = letter;
    btn.dataset.id = n;
    btn.setAttribute('aria-label', 'Escolher letra ' + letter);
    btn.onclick = () => choose(letter, btn);
    $('choices').appendChild(btn);
  });
  
  updateGuide();
}

function updateGuide() {
  document.querySelectorAll('.choice').forEach((btn) => btn.classList.remove('guided'));
  
  if (round >= 5) return;
  
  const target = hidden.find((i) => !filled.has(i));
  if (target === undefined) return;
  
  const expected = [...current.word][target];
  const button = [...document.querySelectorAll('.choice')].find(
    (btn) => !btn.disabled && btn.textContent === expected
  );
  
  if (button) {
    button.classList.add('guided');
    button.setAttribute('aria-label', 'Letra correta destacada: ' + expected);
  }
}

function choose(letter, button) {
  const target = hidden.find((i) => !filled.has(i));
  if (target === undefined) return;
  
  const expected = [...current.word][target];
  
  if (letter === expected) {
    // Acerto
    filled.set(target, letter);
    button.disabled = true;
    renderWord();
    score += 10;
    $('score').textContent = score;
    
    if (filled.size === hidden.length) {
      win(letter);
    } else {
      speakText('Letra ' + letterName(letter) + '. Muito bem!');
      updateGuide();
    }
  } else {
    // Erro
    errors++;
    updateAttempts();
    renderWord(target);
    button.classList.add('wrong');
    
    setTimeout(() => {
      renderWord();
      button.classList.remove('wrong');
    }, 400);
    
    if (errors >= 3) {
      $('message').textContent = 'Três erros. O jogo vai recomeçar! ↻';
      $('message').className = 'message error';
      document.querySelectorAll('.choice').forEach((btn) => (btn.disabled = true));
      speakText(
        'Letra ' + letterName(letter) + '. Você errou três vezes. Vamos voltar ao início do jogo.'
      );
      setTimeout(start, 4200);
    } else {
      const left = 3 - errors;
      $('message').textContent = `Quase! Restam ${left} ${left === 1 ? 'tentativa' : 'tentativas'}.`;
      $('message').className = 'message error';
      speakText(
        `Letra ${letterName(letter)}. Essa letra está errada. Você ainda tem ${left} ${left === 1 ? 'tentativa' : 'tentativas'}.`
      );
    }
  }
}

function win(lastLetter) {
  $('message').textContent = `Muito bem! Você completou ${current.word}! 🎉`;
  $('message').className = 'message success';
  $('progress').style.width = `${((round + 1) / deck.length) * 100}%`;
  
  document.querySelectorAll('.choice').forEach((btn) => (btn.disabled = true));
  confetti();
  
  speakText(
    `Letra ${letterName(lastLetter)}. Muito bem! Você completou a palavra ${current.word.toLowerCase()}.`
  );
  
  $('next').textContent = round === deck.length - 1 ? 'Jogar novamente ↻' : 'Próxima palavra →';
  $('next').classList.add('show');
}

function confetti() {
  const container = $('confetti');
  container.innerHTML = '';
  
  for (let i = 0; i < 38; i++) {
    const piece = document.createElement('i');
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = ['#ffd34e', '#6546d7', '#20b486', '#ef476f'][i % 4];
    piece.style.animationDelay = Math.random() * 0.35 + 's';
    container.appendChild(piece);
  }
}

// ============================================
// DEMONSTRAÇÃO
// ============================================

let demoStep = 0;

function resetDemo() {
  demoTimers.forEach(clearTimeout);
  demoTimers = [];
  demoStep = 0;
  
  ['demoT', 'demoO'].forEach((id) => {
    const el = $(id);
    el.textContent = '?';
    el.className = 'demo-letter gap';
  });
  
  document.querySelectorAll('.demo-choice').forEach((btn) => {
    btn.disabled = false;
    btn.classList.toggle('guided', btn.dataset.demo === 'T');
  });
}

function fillDemo(id, letter) {
  const el = $(id);
  el.textContent = letter;
  el.className = 'demo-letter done';
}

function speakDemo() {
  resetDemo();
  $('audioStatus').textContent = 'Ouça e clique na letra destacada.';
  
  const text =
    'Observe a imagem. É um pato. A palavra já mostra as letras P e A. Entre as letras disponíveis, toque primeiro na letra T, que está destacada. Depois escolha a letra O.';
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    utterance.onerror = () => {
      $('audioStatus').textContent = 'O áudio não está disponível neste navegador.';
    };
    speechSynthesis.speak(utterance);
  } else {
    $('audioStatus').textContent = 'O áudio não está disponível neste navegador.';
  }
}

function chooseDemo(button) {
  const expected = demoStep === 0 ? 'T' : demoStep === 1 ? 'O' : null;
  
  if (!expected) return;
  
  if (button.dataset.demo !== expected) {
    button.classList.add('wrong');
    $('audioStatus').textContent = 'Tente a letra destacada.';
    speakText(
      'Letra ' + letterName(button.dataset.demo) + '. Essa letra está errada. Tente a letra destacada.'
    );
    setTimeout(() => button.classList.remove('wrong'), 400);
    return;
  }
  
  button.disabled = true;
  button.classList.remove('guided');
  fillDemo(demoStep === 0 ? 'demoT' : 'demoO', expected);
  demoStep++;
  
  if (demoStep === 1) {
    const next = [...document.querySelectorAll('.demo-choice')].find((btn) => btn.dataset.demo === 'O');
    next.classList.add('guided');
    $('audioStatus').textContent = 'Muito bem! Agora clique na letra O.';
    speakText('Letra tê. Muito bem! Agora clique na letra ó.');
  } else {
    $('audioStatus').textContent = 'Parabéns! Você completou PATO. Agora comece o jogo! 🎉';
    speakText('Letra ó. Parabéns! Você completou a palavra pato. Agora comece o jogo!');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.querySelectorAll('.demo-choice').forEach((btn) => {
  btn.onclick = () => chooseDemo(btn);
});

$('listenDemo').onclick = speakDemo;

$('beginGame').onclick = () => {
  demoTimers.forEach(clearTimeout);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  
  $('intro').classList.add('hide');
  document.querySelector('main').removeAttribute('aria-hidden');
  document.querySelector('main').removeAttribute('inert');
  
  gameStarted = true;
  setTimeout(speakCurrent, 300);
};

$('readWord').onclick = speakCurrent;

$('next').onclick = () => {
  round++;
  if (round >= deck.length) {
    start();
  } else {
    load();
  }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.querySelector('main').setAttribute('aria-hidden', 'true');
start();

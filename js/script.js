let currentCodes = {};

document.getElementById('encodeBtn').addEventListener('click', () => {
  const inputText = document.getElementById('inputText').value;
  if (inputText.trim() === '') {
    alert('Пожалуйста, введите текст для кодирования.');
    return;
  }

  const { tree, codes } = buildHuffmanTree(inputText);
  const encoded = encodeText(inputText, codes);
  document.getElementById('encodedText').value = encoded;
  currentCodes = codes;

  const codesString = Object.entries(codes)
    .map(([char, code]) => `${char}: ${code}`)
    .join(', ');
  document.getElementById('huffmanCodes').value = codesString;
});

document.getElementById('decodeBtn').addEventListener('click', () => {
  const encodedText = document.getElementById('encodedText').value;
  if (encodedText.trim() === '') {
    alert('Нет закодированного текста для декодирования.');
    return;
  }

  if (Object.keys(currentCodes).length === 0) {
    alert('Коды Хаффмана отсутствуют. Пожалуйста, сначала выполните кодирование.');
    return;
  }

  const decoded = decodeText(encodedText, currentCodes);
  document.getElementById('decodedText').value = decoded;
});

document.getElementById('applyNoiseBtn').addEventListener('click', () => {
  const noiseLevel = parseFloat(document.getElementById('noiseLevel').value);
  if (isNaN(noiseLevel) || noiseLevel < 0 || noiseLevel > 1) {
    alert('Пожалуйста, введите корректный уровень помех (от 0 до 1).');
    return;
  }

  const encodedText = document.getElementById('encodedText').value;
  if (encodedText.trim() === '') {
    alert('Нет закодированного текста для применения помех.');
    return;
  }

  const noisyText = introduceNoise(encodedText, noiseLevel);
  const decodedText = decodeText(noisyText, currentCodes);

  const originalText = document.getElementById('inputText').value;
  const errorRate = calculateErrorRate(originalText, decodedText);
  const entropyOriginal = calculateEntropy(originalText);
  const entropyEncoded = calculateEntropy(encodedText);
  const redundancy = calculateRedundancy(encodedText.length, entropyOriginal);

  document.getElementById('analysisResults').value = `
    Помехоустойчивость: ${(1 - errorRate).toFixed(3)}
    Энтропия исходного сообщения: ${entropyOriginal.toFixed(3)}
    Энтропия кодированного сообщения: ${entropyEncoded.toFixed(3)}
    Коэффициент избыточности: ${redundancy.toFixed(3)}
  `;
});

function buildHuffmanTree(text) {
  const freqMap = {};
  for (let char of text) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const nodes = Object.keys(freqMap).map((char) => ({
    char,
    freq: freqMap[char],
    left: null,
    right: null,
  }));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const newNode = {
      char: null,
      freq: left.freq + right.freq,
      left,
      right,
    };
    nodes.push(newNode);
  }

  const tree = nodes[0];
  const codes = {};
  generateCodes(tree, '', codes);
  return { tree, codes };
}

function generateCodes(node, prefix, codes) {
  if (node.char !== null) {
    codes[node.char] = prefix;
    return;
  }
  if (node.left) {
    generateCodes(node.left, prefix + '0', codes);
  }
  if (node.right) {
    generateCodes(node.right, prefix + '1', codes);
  }
}

function encodeText(text, codes) {
  return text.split('').map((char) => codes[char]).join('');
}

function decodeText(encoded, codes) {
  const reverseCodes = {};
  for (let char in codes) {
    reverseCodes[codes[char]] = char;
  }

  let decoded = '';
  let currentCode = '';
  for (let bit of encoded) {
    currentCode += bit;
    if (reverseCodes[currentCode]) {
      decoded += reverseCodes[currentCode];
      currentCode = '';
    }
  }

  return decoded;
}

function introduceNoise(encodedText, noiseLevel) {
  return encodedText
    .split('')
    .map((bit) => (Math.random() < noiseLevel ? (bit === '0' ? '1' : '0') : bit))
    .join('');
}

function calculateErrorRate(original, decoded) {
  let errors = 0;
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== decoded[i]) {
      errors++;
    }
  }
  return errors / original.length;
}

function calculateEntropy(text) {
  const freqMap = {};
  for (let char of text) {
    freqMap[char] = (freqMap[char] || 0) + 1;
  }

  const probabilities = Object.values(freqMap).map((freq) => freq / text.length);
  return -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function calculateRedundancy(encodedLength, entropy) {
  return (encodedLength - entropy) / encodedLength;
}

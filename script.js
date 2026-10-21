const cubicBtn = document.getElementById('renderCubicBtn');
const balanceBtn = document.getElementById('balanceBtn');
const calcPhysicsBtn = document.getElementById('calcPhysicsBtn');
const reactionInput = document.getElementById('reactionInput');
const physicsFormula = document.getElementById('physicsFormula');

function formatNumber(num) {
  if (Number.isInteger(num)) return String(num);
  return Number(num.toFixed(2)).toString();
}

function renderCubicGraph() {
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');

  const a = Number(document.getElementById('a').value || 0);
  const b = Number(document.getElementById('b').value || 0);
  const c = Number(document.getElementById('c').value || 0);
  const d = Number(document.getElementById('d').value || 0);

  const equation = `y = ${formatNumber(a)}x^3 ${b >= 0 ? '+' : '-'} ${formatNumber(Math.abs(b))}x^2 ${c >= 0 ? '+' : '-'} ${formatNumber(Math.abs(c))}x ${d >= 0 ? '+' : '-'} ${formatNumber(Math.abs(d))}`;
  document.getElementById('cubicResult').textContent = equation;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#020b1a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y <= h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const originX = w / 2;
  const originY = h / 2;
  const scale = 28;

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(w, originY);
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2.5;

  let started = false;
  for (let px = 0; px <= w; px += 1) {
    const x = (px - originX) / scale;
    const y = a * x ** 3 + b * x ** 2 + c * x + d;
    const py = originY - y * scale;

    if (!Number.isFinite(py)) continue;

    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();

  ctx.fillStyle = '#dfeeff';
  ctx.font = '12px sans-serif';

  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    const xPos = originX + i * scale;
    ctx.fillText(String(i), xPos - 4, originY + 18);

    const yPos = originY - i * scale;
    ctx.fillText(String(i), originX + 8, yPos + 4);
  }
}

function parseFormula(formula) {
  const map = {};
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i];

    if (/[A-Z]/.test(ch)) {
      let element = ch;
      i += 1;

      if (i < formula.length && /[a-z]/.test(formula[i])) {
        element += formula[i];
        i += 1;
      }

      let numberString = '';
      while (i < formula.length && /[0-9]/.test(formula[i])) {
        numberString += formula[i];
        i += 1;
      }

      const count = Number(numberString || 1);
      map[element] = (map[element] || 0) + count;
    } else {
      i += 1;
    }
  }

  return map;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const temp = a % b;
    a = b;
    b = temp;
  }
  return a;
}

function isBalanced(candidate, left, right, allElements) {
  for (const element of allElements) {
    let leftCount = 0;
    let rightCount = 0;

    for (let i = 0; i < left.length; i++) {
      leftCount += candidate[i] * (parseFormula(left[i])[element] || 0);
    }

    for (let i = 0; i < right.length; i++) {
      rightCount += candidate[left.length + i] * (parseFormula(right[i])[element] || 0);
    }

    if (leftCount !== rightCount) return false;
  }

  return true;
}

function balanceEquation(reactionText) {
  const normalized = reactionText.replace(/\s+/g, ' ').trim();
  const splitSymbol = normalized.includes('->') ? '->' : '=>';
  const [leftRaw, rightRaw] = normalized.split(splitSymbol).map((part) => part.trim());

  if (!leftRaw || !rightRaw) return null;

  const left = leftRaw.split('+').map((part) => part.trim()).filter(Boolean);
  const right = rightRaw.split('+').map((part) => part.trim()).filter(Boolean);
  const species = [...left, ...right];
  const allElements = [...new Set(species.flatMap((molecule) => Object.keys(parseFormula(molecule))))];

  const coeffs = Array(species.length).fill(0);

  function search(index, maxValue = 12) {
    if (index === species.length) {
      if (coeffs.every((value) => value > 0) && isBalanced(coeffs, left, right, allElements)) {
        const divisor = coeffs.reduce((acc, value) => gcd(acc, value), 0);
        return coeffs.map((value) => value / divisor);
      }
      return null;
    }

    for (let value = 1; value <= maxValue; value += 1) {
      coeffs[index] = value;
      const result = search(index + 1, maxValue);
      if (result) return result;
    }

    return null;
  }

  const result = search(0, 12);
  if (!result) return null;

  const leftSide = left.map((molecule, i) => `${result[i] === 1 ? '' : result[i]}${molecule}`).join(' + ');
  const rightSide = right.map((molecule, i) => `${result[left.length + i] === 1 ? '' : result[left.length + i]}${molecule}`).join(' + ');

  return `${leftSide} -> ${rightSide}`;
}

function balanceReaction() {
  const value = reactionInput.value.trim();
  const result = balanceEquation(value);

  if (!result) {
    document.getElementById('chemResult').innerHTML =
      '無法配平，請檢查反應式格式；例如：H2 + O2 -> H2O 或 C6H12O6 + O2 -> CO2 + H2O';
    return;
  }

  document.getElementById('chemResult').innerHTML = `<strong>配平結果：</strong><br>${result}`;
}

function renderPhysicsInputs() {
  const formulaKey = physicsFormula.value;
  const configs = {
    v: {
      inputs: [
        { key: 'v0', label: 'v₀（初速度）', unit: 'm/s' },
        { key: 'a', label: 'a（加速度）', unit: 'm/s²' },
        { key: 't', label: 't（時間）', unit: 's' }
      ]
    },
    s: {
      inputs: [
        { key: 'v0', label: 'v₀（初速度）', unit: 'm/s' },
        { key: 'a', label: 'a（加速度）', unit: 'm/s²' },
        { key: 't', label: 't（時間）', unit: 's' }
      ]
    },
    v2: {
      inputs: [
        { key: 'v0', label: 'v₀（初速度）', unit: 'm/s' },
        { key: 'a', label: 'a（加速度）', unit: 'm/s²' },
        { key: 's', label: 's（位移）', unit: 'm' }
      ]
    },
    avg: {
      inputs: [
        { key: 'v', label: 'v（末速度）', unit: 'm/s' },
        { key: 'v0', label: 'v₀（初速度）', unit: 'm/s' },
        { key: 't', label: 't（時間）', unit: 's' }
      ]
    }
  };

  const container = document.getElementById('physicsInputs');
  const config = configs[formulaKey];

  container.innerHTML = '';

  config.inputs.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'field';

    const label = document.createElement('label');
    label.textContent = item.label;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.placeholder = item.unit;
    input.id = `phy_${item.key}`;

    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
  });
}

function calculatePhysics() {
  const formulaKey = physicsFormula.value;
  const configs = {
    v: {
      formula: ({ v0, a, t }) => v0 + a * t,
      outputText: 'v'
    },
    s: {
      formula: ({ v0, a, t }) => v0 * t + 0.5 * a * t * t,
      outputText: 's'
    },
    v2: {
      formula: ({ v0, a, s }) => Math.sqrt(v0 ** 2 + 2 * a * s),
      outputText: 'v'
    },
    avg: {
      formula: ({ v, v0, t }) => ((v + v0) / 2) * t,
      outputText: 's'
    }
  };

  const selected = configs[formulaKey];
  const values = {};
  if (formulaKey === 'v' || formulaKey === 's') {
    values.v0 = Number(document.getElementById('phy_v0').value || 0);
    values.a = Number(document.getElementById('phy_a').value || 0);
    values.t = Number(document.getElementById('phy_t').value || 0);
  }

  if (formulaKey === 'v2') {
    values.v0 = Number(document.getElementById('phy_v0').value || 0);
    values.a = Number(document.getElementById('phy_a').value || 0);
    values.s = Number(document.getElementById('phy_s').value || 0);
  }

  if (formulaKey === 'avg') {
    values.v = Number(document.getElementById('phy_v').value || 0);
    values.v0 = Number(document.getElementById('phy_v0').value || 0);
    values.t = Number(document.getElementById('phy_t').value || 0);
  }

  const answer = selected.formula(values);
  document.getElementById('physicsResult').innerHTML =
    `<strong>計算結果：</strong><br>${selected.outputText} = ${Number(answer).toFixed(2)}`;
}

cubicBtn.addEventListener('click', renderCubicGraph);
balanceBtn.addEventListener('click', balanceReaction);
calcPhysicsBtn.addEventListener('click', calculatePhysics);
physicsFormula.addEventListener('change', renderPhysicsInputs);

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    reactionInput.value = chip.dataset.example;
    balanceReaction();
  });
});

renderCubicGraph();
renderPhysicsInputs();

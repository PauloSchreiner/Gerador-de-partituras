"use strict";

/**
 * ==========================================================================
 * MÓDULO 1: ESTADO GLOBAL E VARIÁVEIS DE MEMÓRIA (CÉREBROS DOS MODOS)
 * ==========================================================================
 */
let lastMidi = null;
let pendingTieMidi = null;

const triadState = { degree:0 }; 
const grooveState = { pattern: null, patternLenMeasures: 1, measureInCycle: 0, cycleLength: 4, progression: [0,3,4,0] };
let seqIndex = 0, seqStep = 0, seqDir = 1;
let pedalIsRoot = true, pedalScaleIdx = 0, pedalDir = 1;

/**
 * ==========================================================================
 * MÓDULO 2: CARREGAMENTO DA APLICAÇÃO (OFFLINE-SAFE)
 * ==========================================================================
 */
window.addEventListener('DOMContentLoaded', () => {
  if (window.Vex && window.Vex.Flow) {
      initApp();
  } else {
      document.getElementById('welcome-screen').innerHTML =
          '<h2 style="color:var(--red)">Erro: vexflow.js não encontrado. Certifique-se de que baixou o arquivo e colocou na mesma pasta.</h2>';
  }
});

function initApp(){

/**
 * ==========================================================================
 * MÓDULO 3: CONSTANTES GLOBAIS DE ENGRAVING E TEORIA MUSICAL
 * ==========================================================================
 */
const SCALE = 1.5; 
const LOGICAL_PX_PER_QUARTER = 95; 
const PX_PER_QUARTER = LOGICAL_PX_PER_QUARTER * SCALE; 
const MEASURE_BEATS = 4; 
const LOGICAL_MEASURE_PX = MEASURE_BEATS * LOGICAL_PX_PER_QUARTER; 
const MEASURES_PER_BLOCK = 4; 

const OPEN_STRING_MIDI = { B:23, E:28, A:33, D:38, G:43, C:48 }; 
const STRING_ORDER = ['B','E','A','D','G','C']; 
const MAX_FRET = 24;

const LETTERS = ['C','D','E','F','G','A','B']; 
const LETTER_PC = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const MAJOR_STEPS = [0,2,4,5,7,9,11]; 
const MINOR_STEPS = [0,2,3,5,7,8,10];
const MAJOR_PENTA_STEPS = [0,2,4,7,9]; 
const MINOR_PENTA_STEPS = [0,3,5,7,10];

const MAJOR_KEY_NAMES = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B']; 
const MINOR_KEY_NAMES = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];

const KEYS = [
  { id: 'C-maj', name: 'C Maior', vexKey: 'C', relMajor: 'C', rootPc: 0, isMinor: false },
  { id: 'G-maj', name: 'G Maior', vexKey: 'G', relMajor: 'G', rootPc: 7, isMinor: false },
  { id: 'D-maj', name: 'D Maior', vexKey: 'D', relMajor: 'D', rootPc: 2, isMinor: false },
  { id: 'A-maj', name: 'A Maior', vexKey: 'A', relMajor: 'A', rootPc: 9, isMinor: false },
  { id: 'E-maj', name: 'E Maior', vexKey: 'E', relMajor: 'E', rootPc: 4, isMinor: false },
  { id: 'B-maj', name: 'B Maior', vexKey: 'B', relMajor: 'B', rootPc: 11, isMinor: false },
  { id: 'F#-maj', name: 'F# Maior', vexKey: 'F#', relMajor: 'F#', rootPc: 6, isMinor: false },
  { id: 'F-maj', name: 'F Maior', vexKey: 'F', relMajor: 'F', rootPc: 5, isMinor: false },
  { id: 'Bb-maj', name: 'Bb Maior', vexKey: 'Bb', relMajor: 'Bb', rootPc: 10, isMinor: false },
  { id: 'Eb-maj', name: 'Eb Maior', vexKey: 'Eb', relMajor: 'Eb', rootPc: 3, isMinor: false },
  { id: 'Ab-maj', name: 'Ab Maior', vexKey: 'Ab', relMajor: 'Ab', rootPc: 8, isMinor: false },
  { id: 'Db-maj', name: 'Db Maior', vexKey: 'Db', relMajor: 'Db', rootPc: 1, isMinor: false },
  { id: 'Gb-maj', name: 'Gb Maior', vexKey: 'Gb', relMajor: 'Gb', rootPc: 6, isMinor: false },

  { id: 'A-min', name: 'A menor', vexKey: 'Am', relMajor: 'C', rootPc: 9, isMinor: true },
  { id: 'E-min', name: 'E menor', vexKey: 'Em', relMajor: 'G', rootPc: 4, isMinor: true },
  { id: 'B-min', name: 'B menor', vexKey: 'Bm', relMajor: 'D', rootPc: 11, isMinor: true },
  { id: 'F#-min', name: 'F# menor', vexKey: 'F#m', relMajor: 'A', rootPc: 6, isMinor: true },
  { id: 'C#-min', name: 'C# menor', vexKey: 'C#m', relMajor: 'E', rootPc: 1, isMinor: true },
  { id: 'G#-min', name: 'G# menor', vexKey: 'G#m', relMajor: 'B', rootPc: 8, isMinor: true },
  { id: 'D#-min', name: 'D# menor', vexKey: 'D#m', relMajor: 'F#', rootPc: 3, isMinor: true },
  { id: 'D-min', name: 'D menor', vexKey: 'Dm', relMajor: 'F', rootPc: 2, isMinor: true },
  { id: 'G-min', name: 'G menor', vexKey: 'Gm', relMajor: 'Bb', rootPc: 7, isMinor: true },
  { id: 'C-min', name: 'C menor', vexKey: 'Cm', relMajor: 'Eb', rootPc: 0, isMinor: true },
  { id: 'F-min', name: 'F menor', vexKey: 'Fm', relMajor: 'Ab', rootPc: 5, isMinor: true },
  { id: 'Bb-min', name: 'Bb menor', vexKey: 'Bbm', relMajor: 'Db', rootPc: 10, isMinor: true },
  { id: 'Eb-min', name: 'Eb menor', vexKey: 'Ebm', relMajor: 'Gb', rootPc: 3, isMinor: true }
];

function parseTonic(name){ 
    const letter = name[0]; 
    const acc = name.length > 1 ? (name[1] === '#' ? 1 : -1) : 0; 
    return { letter, pc: (LETTER_PC[letter] + acc + 12) % 12 }; 
}

function buildMajorSpelling(tonicName){
  const { letter, pc: tonicPc } = parseTonic(tonicName); 
  const i0 = LETTERS.indexOf(letter); 
  const table = new Array(12).fill(null);
  for(let d=0; d<7; d++){ 
      const letterChar = LETTERS[(i0+d)%7]; 
      const naturalPc = LETTER_PC[letterChar]; 
      const desiredPc = (tonicPc + MAJOR_STEPS[d]) % 12; 
      let acc = ((desiredPc - naturalPc + 18) % 12) - 6; 
      table[desiredPc] = { letter: letterChar, acc }; 
  }
  for(let pc=0; pc<12; pc++){ 
      if(!table[pc]){ 
          const below = table[(pc - 1 + 12) % 12]; 
          table[pc] = { letter: below.letter, acc: below.acc + 1 }; 
      } 
  }
  return table;
}

const UNIQUE_MAJORS = ['C','G','D','A','E','B','F#','F','Bb','Eb','Ab','Db','Gb'];
const SPELLINGS = {}; 
for (let tonic of UNIQUE_MAJORS) { SPELLINGS[tonic] = buildMajorSpelling(tonic); }

function accToStr(acc){ return acc===0?'':acc===1?'#':acc===2?'##':acc===-1?'b':acc===-2?'bb':''; }

function midiToVexKey(midi){
  const relMajor = state.keyInfo.relMajor; 
  const pc = ((midi % 12) + 12) % 12;
  const entry = SPELLINGS[relMajor][pc];
  let octave = Math.floor(midi / 12);
  if (pc === 0 && entry.letter === 'B') octave -= 1; 
  if (pc === 11 && entry.letter === 'C') octave += 1; 

  return { key: `${entry.letter.toLowerCase()}${accToStr(entry.acc)}/${octave}`, letter: entry.letter, acc: entry.acc };
}

function restKeyForClef(clef) {
    if (clef === 'treble') return 'b/4';
    if (clef === 'alto') return 'c/4';
    if (clef === 'tenor') return 'a/3';
    return 'd/3'; 
}

function getCenterMidiForClef(clef) {
    if (clef === 'treble') return 71; 
    if (clef === 'alto') return 60;   
    if (clef === 'tenor') return 57;  
    return 50; 
}

// CORREÇÃO PENTATONICA: array 100% diatônico (7 notas) estritamente usado para encontrar as raízes dos acordes
function diatonicPitchClasses() {
    const steps = state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS;
    return steps.map(s => (state.keyInfo.rootPc + s) % 12);
}

function getChordSymbol(degree) {
    const suffixMaj = ["", "m", "m", "maj7", "7", "m", "dim"];
    const suffixMin = ["m", "dim", "maj7", "m", "m", "maj7", "7"];
    const suffix = state.keyInfo.isMinor ? suffixMin[degree] : suffixMaj[degree];
    const chordRootPc = diatonicPitchClasses()[degree]; 
    const rootSpell = SPELLINGS[state.keyInfo.relMajor][chordRootPc];
    return rootSpell.letter.toUpperCase() + accToStr(rootSpell.acc) + suffix;
}

// Array filtrado para a parte melódica (usado em arpejos e sequências)
function scalePitchClasses(){ 
    const steps = state.pentatonic ? 
        (state.keyInfo.isMinor ? MINOR_PENTA_STEPS : MAJOR_PENTA_STEPS) : 
        (state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS);
    return steps.map(s => (state.keyInfo.rootPc + s) % 12); 
}
function scaleSemitones() { return state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS; }

/**
 * ==========================================================================
 * MÓDULO 4: ESTADO DA APLICAÇÃO (CÉREBRO)
 * ==========================================================================
 */
const state = {
  bpm: 60, countIn: true, noteAudio: true, clickAudio: true,
  volClick: 1.0, volSynth: 0.5, 
  keyInfo: KEYS[0], clef: 'bass', pentatonic: false, 
  positionMode: 'free', lowMidi: 28, highMidi: 48, strings: new Set(['E','A','D','G']), maxIntervalSemis: 12, 
  
  rhythms: { whole: 0, half: 0, quarter: 100, eighth: 0, sixteenth: 0, dotted: 0 },
  rhythmCells: {
      c1_four16: 0, c2_8_16_16: 0, c3_16_16_8: 0, c4_16_8_16: 0, 
      c5_dot8_16: 0, c6_16_dot8: 0, c7_r16_three16: 0, c8_8_r16_16: 0, c9_tripletQE: 0,
  },
  probs: { rests: 0.05, triplets: 0.0, ties: 0.0, chromatic: 0.0, ghost: 0.0, staccato: 0.0 },
  genMode: 'random', seqPattern: 'thirds',
  playing: false, paused: false, pauseTime: 0
};

/**
 * ==========================================================================
 * MÓDULO 5: CONTROLES DA INTERFACE DO USUÁRIO E ATUALIZAÇÕES VISUAIS
 * ==========================================================================
 */
function safeAddListener(id, eventType, callback) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(eventType, callback);
}

safeAddListener('openSettingsBtn', 'click', () => toggleSettings(true));
safeAddListener('closeSettingsBtn', 'click', () => toggleSettings(false));
safeAddListener('settings-overlay', 'click', () => toggleSettings(false));

function toggleSettings(show) {
  const ov = document.getElementById('settings-overlay'), p = document.getElementById('settings');
  if(ov && p) {
      if(show) { ov.classList.add('open'); p.classList.add('open'); } 
      else { ov.classList.remove('open'); p.classList.remove('open'); }
  }
}

const keySelect = document.getElementById('keySelect');
if (keySelect) {
    KEYS.forEach(k => {
        let o = document.createElement('option'); o.value = k.id; o.textContent = k.name; keySelect.appendChild(o);
    });
    keySelect.addEventListener('change', (e) => { 
        state.keyInfo = KEYS.find(k => k.id === e.target.value); 
        renderClefPanel(); 
    });
}

const NOTE_LABELS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const lowSel = document.getElementById('lowNote'), highSel = document.getElementById('highNote');

function updateNoteRangesForClef() {
    const ranges = {
        'bass': { min: 23, max: 72 },   
        'treble': { min: 40, max: 108 }, 
        'alto': { min: 36, max: 84 },   
        'tenor': { min: 36, max: 84 }   
    };
    const range = ranges[state.clef] || ranges['bass'];
    
    if (lowSel && highSel) {
        lowSel.innerHTML = ''; highSel.innerHTML = '';
        for(let m = range.min; m <= range.max; m++) {
            const l = `${NOTE_LABELS[((m%12)+12)%12]}${Math.floor(m/12)-1}`;
            let o1 = document.createElement('option'); o1.value=m; o1.textContent=l; lowSel.appendChild(o1);
            let o2 = document.createElement('option'); o2.value=m; o2.textContent=l; highSel.appendChild(o2);
        }
        
        state.lowMidi = Math.max(range.min, Math.min(state.lowMidi, range.max));
        state.highMidi = Math.max(range.min, Math.min(state.highMidi, range.max));
        lowSel.value = state.lowMidi;
        highSel.value = state.highMidi;
    }
    
    const isBass = state.clef === 'bass';
    const fieldset = document.getElementById('stringsFieldset');
    const posMode = document.getElementById('positionMode');
    
    if (fieldset) fieldset.style.display = isBass ? 'block' : 'none';
    if (!isBass) {
        state.positionMode = 'free';
        if (posMode) { posMode.value = 'free'; posMode.disabled = true; }
    } else {
        if (posMode) posMode.disabled = false;
    }
    renderClefPanel();
}

safeAddListener('clefSelect', 'change', (e) => { 
    state.clef = e.target.value; 
    updateNoteRangesForClef();
});
updateNoteRangesForClef();

if (lowSel) lowSel.addEventListener('change', () => state.lowMidi = parseInt(lowSel.value,10));
if (highSel) highSel.addEventListener('change', () => state.highMidi = parseInt(highSel.value,10));

function syncProb(id, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        state.probs[stateKey] = parseInt(el.value, 10) / 100;
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value + '%';
    });
}
syncProb('probRest', 'rests', 'lblProbRest');
syncProb('probTriplet', 'triplets', 'lblProbTriplet');
syncProb('probTie', 'ties', 'lblProbTie');
syncProb('probChromatic', 'chromatic', 'lblProbChromatic');
syncProb('probGhost', 'ghost', 'lblProbGhost');
syncProb('probStaccato', 'staccato', 'lblProbStaccato');

function syncWeight(id, stateObj, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        stateObj[stateKey] = parseInt(el.value, 10);
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value;
    });
}
syncWeight('wWhole', state.rhythms, 'whole', 'lblWWhole');
syncWeight('wHalf', state.rhythms, 'half', 'lblWHalf');
syncWeight('wQuarter', state.rhythms, 'quarter', 'lblWQuarter');
syncWeight('wEighth', state.rhythms, 'eighth', 'lblWEighth');
syncWeight('wSixteenth', state.rhythms, 'sixteenth', 'lblWSixteenth');
syncWeight('wDotted', state.rhythms, 'dotted', 'lblWDotted');

syncWeight('w_c1', state.rhythmCells, 'c1_four16', 'lblC1');
syncWeight('w_c2', state.rhythmCells, 'c2_8_16_16', 'lblC2');
syncWeight('w_c3', state.rhythmCells, 'c3_16_16_8', 'lblC3');
syncWeight('w_c4', state.rhythmCells, 'c4_16_8_16', 'lblC4');
syncWeight('w_c5', state.rhythmCells, 'c5_dot8_16', 'lblC5');
syncWeight('w_c6', state.rhythmCells, 'c6_16_dot8', 'lblC6');
syncWeight('w_c7', state.rhythmCells, 'c7_r16_three16', 'lblC7');
syncWeight('w_c8', state.rhythmCells, 'c8_8_r16_16', 'lblC8');
syncWeight('w_c9', state.rhythmCells, 'c9_tripletQE', 'lblC9');

function syncVolume(id, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        state[stateKey] = parseInt(el.value, 10) / 100;
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value + '%';
    });
}
syncVolume('volClick', 'volClick', 'lblVolClick');
syncVolume('volSynth', 'volSynth', 'lblVolSynth');

safeAddListener('pentaToggle', 'change', e => state.pentatonic = e.target.checked);

const positionModeSel = document.getElementById('positionMode'), rangeRow = document.getElementById('rangeRow');
if (positionModeSel && rangeRow) {
    positionModeSel.addEventListener('change', () => {
      state.positionMode = positionModeSel.value;
      rangeRow.style.opacity = state.positionMode === 'free' ? '1' : '.4'; rangeRow.style.pointerEvents = state.positionMode === 'free' ? 'auto' : 'none';
    });
}

safeAddListener('stringsRow', 'click', e => {
  const p = e.target.closest('.pill'); if(!p) return; const s = p.dataset.string;
  if(state.strings.has(s)){ state.strings.delete(s); p.classList.remove('active'); } else { state.strings.add(s); p.classList.add('active'); }
});

const intervalsData = [
    { semi: 2, label: '2ª (1 tom)' }, { semi: 4, label: '3ª (Maior/menor)' }, { semi: 5, label: '4ª (Justa)' },
    { semi: 7, label: '5ª (Justa)' }, { semi: 9, label: '6ª (Maior/menor)' }, { semi: 11, label: '7ª (Maior/menor)' },
    { semi: 12, label: '8ª (Oitava)' }, { semi: 14, label: '9ª (Oitava + 2ª)' }, { semi: 16, label: '10ª (Oitava + 3ª)' },
    { semi: 17, label: '11ª (Oitava + 4ª)' }, { semi: 19, label: '12ª (Oitava + 5ª)' }, { semi: 21, label: '13ª (Oitava + 6ª)' },
    { semi: 23, label: '14ª (Oitava + 7ª)' }, { semi: 24, label: '15ª (Dupla Oitava)' }
];
const intervalSlider = document.getElementById('intervalSlider'); 
if (intervalSlider) {
    const lbl = document.getElementById('intervalLabel');
    if (lbl) lbl.textContent = 'Máximo: ' + intervalsData[intervalSlider.value].label;
    intervalSlider.addEventListener('input', () => { 
        state.maxIntervalSemis = intervalsData[intervalSlider.value].semi; 
        if (lbl) lbl.textContent = 'Máximo: ' + intervalsData[intervalSlider.value].label; 
    });
}

function redrawTrackAfterThemeChange() {
    if (!state.playing) {
        clearTrack();
        ensureBuffer(0);
    } else {
        const oldMeasures = [...measures];
        measures = [];
        if (scoreScroll) scoreScroll.innerHTML = '';
        oldMeasures.forEach(m => {
            const div = document.createElement('div');
            div.className = 'measure';
            div.style.left = m.leftPx + 'px';
            if (scoreScroll) scoreScroll.appendChild(div);
            m.div._blockEventsData ? renderBlockSVG(div, m.div._blockEventsData) : stopPlayback();
            m.div = div;
            measures.push(m);
        });
    }
}

safeAddListener('themeToggle', 'click', () => {
  const btn = document.getElementById('themeToggle');
  if(document.documentElement.getAttribute('data-theme') === 'light'){ 
      document.documentElement.removeAttribute('data-theme'); if(btn) btn.textContent = '☀️'; 
  } else { 
      document.documentElement.setAttribute('data-theme', 'light'); if(btn) btn.textContent = '🌙'; 
  }
  renderClefPanel(); 
  redrawTrackAfterThemeChange();
});

safeAddListener('genMode', 'change', e => { 
  state.genMode = e.target.value; grooveState.pattern = null; grooveState.measureInCycle = 0; 
  const seq = document.getElementById('sequencesOpts');
  if (seq) seq.style.display = state.genMode === 'sequences' ? 'flex' : 'none';
});
safeAddListener('seqPattern', 'change', e => state.seqPattern = e.target.value);

/**
 * ==========================================================================
 * MÓDULO 6: MATEMÁTICA DA GERAÇÃO DE NOTAS E PADRÕES
 * ==========================================================================
 */
function computePitchPool(){
  const pool = new Set();
  
  if(state.positionMode !== 'free' && state.clef === 'bass'){
    const activeStrings = STRING_ORDER.filter(s => state.strings.has(s));
    if(activeStrings.length > 0){
        const pos = parseInt(state.positionMode, 10);
        for(const s of activeStrings){
          if (pos === 1) pool.add(OPEN_STRING_MIDI[s] + 0); 
          for(let fret=pos; fret<=pos+3; fret++) pool.add(OPEN_STRING_MIDI[s] + fret);
        }
    }
  } else {
    for(let m = state.lowMidi; m <= state.highMidi; m++) pool.add(m);
  }
  
  return Array.from(pool).filter(m => m >= state.lowMidi && m <= state.highMidi).sort((a,b)=>a-b);
}

function diatonicFilter(pool){ 
    const sPcs = new Set(scalePitchClasses()); 
    return pool.filter(m => sPcs.has(((m%12)+12)%12)); 
}

function pickNextPitch(pool, prevMidi){
  if(pool.length === 0) return null;
  const diatonic = diatonicFilter(pool);
  
  let candidates = diatonic.length ? diatonic : pool;
  if(prevMidi == null) return candidates[Math.floor(Math.random()*candidates.length)];
  
  let inRange = candidates.filter(m => Math.abs(m - prevMidi) <= state.maxIntervalSemis);
  if(inRange.length === 0) inRange = [candidates.reduce((best,m)=> Math.abs(m-prevMidi) < Math.abs(best-prevMidi) ? m : best)];
  return inRange[Math.floor(Math.random()*inRange.length)];
}

function diatonicTriad(degreeIndex, includeSeventh){
  const steps = scaleSemitones();
  const degrees = includeSeventh ? [0,2,4,6] : [0,2,4];
  return degrees.map(off => (state.keyInfo.rootPc + steps[(degreeIndex + off) % 7] + 12*Math.floor((degreeIndex + off) / 7)) % 12);
}

function nearestPitchOfClass(pool, pc, prevMidi){
  const options = pool.filter(m => ((m%12)+12)%12 === pc);
  return options.length === 0 ? null : (prevMidi == null ? options[Math.floor(options.length/2)] : options.reduce((best,m)=> Math.abs(m-prevMidi) <= Math.abs(best-prevMidi) ? m : best));
}

const seqPatterns = {
    'thirds': [0, 2], 'fourths': [0, 3], 'fifths': [0, 4], 'sixths': [0, 5],
    'zigzag': [0, 1, 2, 3, 2, 3, 4, 5], 'group3': [0, 1, 2], 'group4': [0, 1, 2, 3],
    'diatonic_arps': [0, 2, 4], 'hanon': [0, 2, 1, 3]
};

function getSequenceNote(diatonicPool) {
  if (diatonicPool.length < 5) return diatonicPool.length ? diatonicPool[0] : null; 
  const pat = seqPatterns[state.seqPattern] || seqPatterns['thirds'];
  
  if (seqStep === 0) {
    const maxOff = Math.max(...pat);
    if (seqDir === 1 && seqIndex + maxOff >= diatonicPool.length) { seqDir = -1; seqIndex--; } 
    else if (seqDir === -1 && seqIndex - maxOff < 0) { seqDir = 1; seqIndex++; }
  }
  
  let offset = pat[seqStep];
  let targetIdx = Math.max(0, Math.min(diatonicPool.length - 1, seqIndex + (offset * seqDir)));
  let midi = diatonicPool[targetIdx];
  
  seqStep++; 
  if (seqStep >= pat.length) { seqStep = 0; seqIndex += seqDir; }
  return midi;
}

function getPedalNote(pool, diatonicPool) {
  if(!diatonicPool.length) return pool.length ? pool[0] : null;
  const rootNotes = pool.filter(m => ((m%12)+12)%12 === state.keyInfo.rootPc).sort((a,b)=>a-b);
  const pedalMidi = rootNotes.length ? rootNotes[0] : pool[0];
  
  if(pedalIsRoot) { 
      pedalIsRoot = false; return pedalMidi; 
  } else {
    pedalIsRoot = true; pedalScaleIdx += pedalDir;
    if(pedalScaleIdx >= diatonicPool.length || pedalScaleIdx <= 0) { pedalDir *= -1; pedalScaleIdx += pedalDir*2; }
    pedalScaleIdx = Math.max(0, Math.min(diatonicPool.length-1, pedalScaleIdx));
    let mel = diatonicPool[pedalScaleIdx];
    if(mel === pedalMidi && diatonicPool.length > 1) { 
        pedalScaleIdx = Math.max(0, Math.min(diatonicPool.length-1, pedalScaleIdx + pedalDir)); 
        mel = diatonicPool[pedalScaleIdx]; 
    }
    return mel;
  }
}

/**
 * ==========================================================================
 * MÓDULO 7: GERADOR RÍTMICO CENTRAL
 * ==========================================================================
 */

function cellNote(dur, isDotted){ return { durQuarters: dur, isDotted: !!isDotted, isRest: Math.random() < state.probs.rests }; }
function cellRest(dur){ return { durQuarters: dur, isRest: true }; }

const ESSENTIAL_CELL_BUILDERS = {
  c1_four16: () => [cellNote(0.25), cellNote(0.25), cellNote(0.25), cellNote(0.25)].map(e => ({ ...e, isRest: false })),
  c2_8_16_16: () => [{ durQuarters:0.5, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }],
  c3_16_16_8: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.5, isRest:false }],
  c4_16_8_16: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.5, isRest:false }, { durQuarters:0.25, isRest:false }],
  c5_dot8_16: () => [{ durQuarters:0.75, isDotted:true, isRest:false }, { durQuarters:0.25, isRest:false }],
  c6_16_dot8: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.75, isDotted:true, isRest:false }],
  c7_r16_three16: () => [cellRest(0.25), { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }],
  c8_8_r16_16: () => [{ durQuarters:0.5, isRest:false }, cellRest(0.25), { durQuarters:0.25, isRest:false }],
  c9_tripletQE: () => [
    { durQuarters: 2/3, tripletGroup: 2, isRest: false },
    { durQuarters: 1/3, tripletGroup: 1, isRest: false },
  ],
};

function hasAnyRhythmFigureEnabled(){
  const r = state.rhythms;
  if (r.whole > 0 || r.half > 0 || r.quarter > 0 || r.eighth > 0 || r.sixteenth > 0) return true;
  return Object.keys(ESSENTIAL_CELL_BUILDERS).some(key => state.rhythmCells[key] > 0);
}

function generateRhythmForMeasure(){
  if (!hasAnyRhythmFigureEnabled()) return [cellRest(4.0)];

  const events = [];
  let currentBeat = 0;

  while (currentBeat < 4.0) {
    const beatsLeft = 4.0 - currentBeat;
    
    if (beatsLeft >= 1.0 && Math.random() < state.probs.triplets) {
        for (let i = 0; i < 3; i++) events.push({ durQuarters: 1/3, tripletGroup: 1, isRest: Math.random() < state.probs.rests });
        currentBeat += 1.0;
        continue;
    }

    const candidates = [];
    const onStableBoundary = (Math.abs(currentBeat - 0.0) < 0.01 || Math.abs(currentBeat - 2.0) < 0.01);

    if (Math.abs(currentBeat - 0.0) < 0.01 && beatsLeft >= 3.99 && state.rhythms.whole > 0) {
        candidates.push({ builder: () => [cellNote(4.0)], weight: state.rhythms.whole });
    }
    
    if (onStableBoundary && beatsLeft >= 1.99 && state.rhythms.half > 0) {
        candidates.push({ builder: () => [cellNote(2.0)], weight: state.rhythms.half });
        
        if (state.rhythms.dotted > 0 && Math.abs(currentBeat - 0.0) < 0.01 && beatsLeft >= 2.99) {
            candidates.push({ builder: () => [cellNote(3.0, true)], weight: (state.rhythms.half + state.rhythms.dotted) / 2 });
        }
    }
    
    if (onStableBoundary && beatsLeft >= 1.99 && state.rhythms.quarter > 0 && state.rhythms.eighth > 0 && state.rhythms.dotted > 0) {
        candidates.push({ builder: () => [cellNote(1.5, true), cellNote(0.5)], weight: (state.rhythms.quarter + state.rhythms.eighth + state.rhythms.dotted) / 3 });
    }
    
    if (beatsLeft >= 0.99) {
        if (state.rhythms.quarter > 0) candidates.push({ builder: () => [cellNote(1.0)], weight: state.rhythms.quarter });
        if (state.rhythms.eighth > 0) candidates.push({ builder: () => [cellNote(0.5), cellNote(0.5)], weight: state.rhythms.eighth });
        if (state.rhythms.sixteenth > 0) candidates.push({ builder: () => [cellNote(0.25), cellNote(0.25), cellNote(0.25), cellNote(0.25)], weight: state.rhythms.sixteenth });
        
        if (state.rhythms.eighth > 0 && state.rhythms.sixteenth > 0) {
            const wMixed = (state.rhythms.eighth + state.rhythms.sixteenth) / 2;
            candidates.push({ builder: () => [cellNote(0.5), cellNote(0.25), cellNote(0.25)], weight: wMixed });
            candidates.push({ builder: () => [cellNote(0.25), cellNote(0.25), cellNote(0.5)], weight: wMixed });
            if (state.rhythms.dotted > 0) {
                const wDotted = (state.rhythms.eighth + state.rhythms.sixteenth + state.rhythms.dotted) / 3;
                candidates.push({ builder: () => [cellNote(0.75, true), cellNote(0.25)], weight: wDotted });
            }
        }

        Object.keys(ESSENTIAL_CELL_BUILDERS).forEach(key => {
            if (state.rhythmCells[key] > 0) {
                candidates.push({ builder: ESSENTIAL_CELL_BUILDERS[key], weight: state.rhythmCells[key] });
            }
        });
    }

    if (candidates.length === 0) {
        let restDur = beatsLeft >= 1.0 ? 1.0 : beatsLeft;
        events.push(cellRest(restDur));
        currentBeat += restDur;
    } else {
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let roll = Math.random() * totalWeight;
        let selectedBuilder = candidates[candidates.length - 1].builder;
        
        for (const c of candidates) {
            if (roll < c.weight) {
                selectedBuilder = c.builder;
                break;
            }
            roll -= c.weight;
        }
        
        const built = selectedBuilder();
        events.push(...built);
        
        const dur = built.reduce((sum, e) => sum + e.durQuarters, 0);
        currentBeat += dur;
    }
  }
  return events;
}

/**
 * ==========================================================================
 * MÓDULO 8: ORQUESTRADOR DOS COMPASSOS E FATIADOR
 * ==========================================================================
 */
function buildMeasure(isLastMeasureInBlock = false){
  const pool = computePitchPool();
  if (pool.length === 0) return [{ durQuarters: 4.0, isRest: true, midi: null }]; 

  const diatonicPool = diatonicFilter(pool);

  let rawRhythm;
  if(state.genMode === 'groove'){
    if(!grooveState.pattern){ 
        grooveState.patternLenMeasures = Math.random() < 0.5 ? 1 : 2; 
        grooveState.pattern = []; 
        for(let i=0;i<grooveState.patternLenMeasures;i++) grooveState.pattern.push(generateRhythmForMeasure()); 
    }
    rawRhythm = grooveState.pattern[grooveState.measureInCycle % grooveState.patternLenMeasures].map(e => ({...e}));
    if((grooveState.measureInCycle % grooveState.cycleLength) === grooveState.cycleLength - 1 && Math.random() < 0.6){
      let acc=0, cut=-1; 
      for(let i=0;i<rawRhythm.length;i++){ acc += rawRhythm[i].durQuarters; if(acc > 3.001){ cut=i; break; } }
      if(cut>=0) { 
          rawRhythm = rawRhythm.slice(0,cut); 
          rawRhythm.push({durQuarters:0.5, isRest:false}, {durQuarters:0.5, isRest:false}); 
      }
    }
  } else { 
      rawRhythm = generateRhythmForMeasure(); 
  }

  let mergedRhythm = [];
  for (let i = 0; i < rawRhythm.length; i++) {
      let ev = Object.assign({}, rawRhythm[i]);
      if (!ev.isRest && !ev.tripletGroup) {
          while (i < rawRhythm.length - 1 && !rawRhythm[i+1].isRest && !rawRhythm[i+1].tripletGroup && Math.random() < state.probs.ties) {
              ev.durQuarters += rawRhythm[i+1].durQuarters;
              i++;
          }
      }
      mergedRhythm.push(ev);
  }

  let chordTonePos = 0;
  let isFirstNote = true;
  for (let i = 0; i < mergedRhythm.length; i++) {
      let ev = mergedRhythm[i];
      if (ev.isRest) {
          ev.midi = null; continue;
      }
      
      if (isFirstNote && pendingTieMidi !== null) {
          ev.midi = pendingTieMidi;
          lastMidi = ev.midi;
          isFirstNote = false;
          continue; 
      }

      if(state.genMode === 'triads'){ 
          if (isFirstNote && chordTonePos === 0) triadState.degree = Math.floor(Math.random() * 7);
          const chordPcs = diatonicTriad(triadState.degree, Math.random() < 0.25); 
          if (isFirstNote) ev.chordSymbol = getChordSymbol(triadState.degree);
          ev.midi = nearestPitchOfClass(pool, chordPcs[chordTonePos++ % chordPcs.length], lastMidi) || pickNextPitch(pool, lastMidi); 
      }
      else if(state.genMode === 'groove'){
        triadState.degree = grooveState.progression[Math.floor(grooveState.measureInCycle / grooveState.cycleLength) % grooveState.progression.length];
        const chordPcs = diatonicTriad(triadState.degree, Math.random() < 0.25);
        if (isFirstNote) ev.chordSymbol = getChordSymbol(triadState.degree);
        ev.midi = nearestPitchOfClass(pool, chordPcs[chordTonePos++ % chordPcs.length], lastMidi) || pickNextPitch(pool, lastMidi);
      } 
      else if(state.genMode === 'sequences') { ev.midi = getSequenceNote(diatonicPool) || pickNextPitch(pool, lastMidi); }
      else if(state.genMode === 'pedal') { ev.midi = getPedalNote(pool, diatonicPool) || pickNextPitch(pool, lastMidi); }
      else { ev.midi = pickNextPitch(pool, lastMidi); } 
      
      lastMidi = ev.midi;
      isFirstNote = false;
  }

  let sliced = [];
  let currentTime = 0;
  for (let ev of mergedRhythm) {
      if (ev.isRest || ev.tripletGroup) {
          sliced.push(ev);
          currentTime += ev.durQuarters;
          continue;
      }

      let rem = ev.durQuarters;
      while (rem > 0.001) {
          let end = currentTime + rem;
          let splitAt = null;
          let isWhole = Math.abs(currentTime) < 0.001 && Math.abs(rem - 4.0) < 0.001;

          if (!isWhole) {
              if (currentTime < 1.999 && end > 2.001) {
                  splitAt = 2.0;
              } 
              else if (Math.abs(currentTime % 1) > 0.001) {
                  let nextBeat = Math.floor(currentTime) + 1.0;
                  let isShortSyncope = Math.abs(rem - 1.0) < 0.001 && 
                                       (Math.abs(currentTime - 0.5) < 0.001 || Math.abs(currentTime - 2.5) < 0.001);
                                       
                  if (!isShortSyncope && end > nextBeat + 0.001) {
                      splitAt = nextBeat;
                  }
              }
          }

          if (splitAt !== null) {
              let cut = splitAt - currentTime;
              sliced.push({ ...ev, durQuarters: cut, tieToNext: true });
              rem -= cut;
              currentTime = splitAt;
          } else {
              sliced.push({ ...ev, durQuarters: rem });
              currentTime += rem;
              rem = 0;
          }
      }
  }

  let factored = [];
  const VALID_DURS = [4.0, 3.0, 2.0, 1.5, 1.0, 0.75, 0.5, 0.25];
  
  for (let ev of sliced) {
      if (ev.isRest || ev.tripletGroup) {
          factored.push(ev);
          continue;
      }

      let rem = ev.durQuarters;
      while (rem > 0.001) {
          let chunk = 0.25;
          for (let d of VALID_DURS) {
              if (rem >= d - 0.001) { chunk = d; break; }
          }
          
          let isLastChunk = Math.abs(rem - chunk) < 0.001;
          let tieForward = isLastChunk ? (ev.tieToNext || false) : true;
          
          factored.push({ ...ev, durQuarters: chunk, tieToNext: tieForward, isDotted: (chunk === 3.0 || chunk === 1.5 || chunk === 0.75) });
          rem -= chunk;
      }
  }

  let lastEv = factored[factored.length - 1];
  if (!isLastMeasureInBlock && !lastEv.isRest && Math.random() < state.probs.ties) {
      lastEv.tieToNext = true;
  }

  for (let i = 1; i < factored.length; i++) {
      if (factored[i-1].tieToNext && !factored[i-1].isRest && !factored[i].isRest) {
          factored[i].tiedFromPrev = true;
      }
  }
  if (pendingTieMidi !== null && !factored[0].isRest) {
       factored[0].tiedFromPrev = true;
  }

  if (factored[factored.length - 1].tieToNext && !factored[factored.length - 1].isRest) {
      pendingTieMidi = factored[factored.length - 1].midi;
  } else {
      pendingTieMidi = null;
  }

  if (state.probs.chromatic > 0 && ['random', 'groove', 'pedal'].includes(state.genMode)) {
      for(let i=0; i < factored.length - 1; i++) {
          const curr = factored[i];
          const next = factored[i+1];
          if (!curr.isRest && !next.isRest && curr.durQuarters <= 0.5 && !curr.tieToNext && !curr.tiedFromPrev) {
              if (Math.random() < state.probs.chromatic) {
                  const approachDir = Math.random() < 0.5 ? 1 : -1;
                  const newMidi = next.midi + approachDir;
                  if (newMidi >= state.lowMidi && newMidi <= state.highMidi) curr.midi = newMidi;
              }
          }
      }
  }

  for(const ev of factored){ 
      if(ev.isRest || ev.tiedFromPrev || ev.tieToNext) continue; 
      const rand = Math.random();
      if(rand < state.probs.ghost) ev.isGhost = true; 
      else if(rand < state.probs.ghost + state.probs.staccato) ev.isStaccato = true; 
  }
  
  if(state.genMode === 'groove'){ 
      grooveState.measureInCycle++; 
      if(grooveState.measureInCycle % grooveState.cycleLength === 0) grooveState.pattern = null; 
  }
  return factored;
}

function buildBlock() {
    const blockEvents = [];
    for (let m = 0; m < MEASURES_PER_BLOCK; m++) {
        const isLast = (m === MEASURES_PER_BLOCK - 1);
        blockEvents.push(buildMeasure(isLast));
    }
    return blockEvents;
}

/**
 * ==========================================================================
 * MÓDULO 9: RENDERIZAÇÃO GRÁFICA VEXFLOW (BLINDADO CONTRA SETNOTE ERROR)
 * ==========================================================================
 */
function durToVexCode(q){
  if(Math.abs(q - 4.0) < 0.001) return 'w';
  if(Math.abs(q - 3.0) < 0.001) return 'hd';
  if(Math.abs(q - 2.0) < 0.001) return 'h';
  if(Math.abs(q - 1.5) < 0.001) return 'qd';
  if(Math.abs(q - 1.0) < 0.001) return 'q';
  if(Math.abs(q - 0.75) < 0.001) return '8d';
  if(Math.abs(q - 0.5) < 0.001) return '8';
  if(Math.abs(q - 0.25) < 0.001) return '16';
  return '8'; 
}

const NOTE_MODIFIER_ORDER = (function detectAddModifierOrder(){
  try {
    const VF = Vex.Flow;
    const probeNote = new VF.StaveNote({ keys: ['c/4'], duration: 'q' });
    const probeDot = new VF.Dot();
    probeNote.addModifier(probeDot, 0); 
    return 'modifier-first';
  } catch (e) {
    return 'index-first'; 
  }
})();

function addNoteModifier(note, modifier, index){
  if (NOTE_MODIFIER_ORDER === 'modifier-first') note.addModifier(modifier, index);
  else note.addModifier(index, modifier);
}

function renderBlockSVG(container, blockEvents){
  const VF = Vex.Flow;
  const logicalWidth = LOGICAL_MEASURE_PX * MEASURES_PER_BLOCK; 
  
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize((logicalWidth + 20) * SCALE, 150 * SCALE);
  const ctx = renderer.getContext(); 
  ctx.scale(SCALE, SCALE);
  
  ctx.setFillStyle(getComputedStyle(document.documentElement).getPropertyValue('--text-0').trim() || '#e9ecf1');
  ctx.setStrokeStyle(getComputedStyle(document.documentElement).getPropertyValue('--staff').trim() || '#8a93a3');

  container._blockEventsData = blockEvents;

  const allVexNotes = [];

  blockEvents.forEach((events, measureIndex) => {
      const startX = measureIndex * LOGICAL_MEASURE_PX;
      const stave = new VF.Stave(startX, 10, LOGICAL_MEASURE_PX); 
      try { stave.setBegBarType(VF.Barline.type.NONE); } catch(e) {}
      stave.setContext(ctx).draw();

      const vexNotes = [], tuplets = [], beams = [];
      let currentBeat = 0, curTripletGroup = [], curTripletDur = 0;
      const beatGroups = {}; 

      events.forEach((ev) => {
        let vexKey = ev.isRest ? restKeyForClef(state.clef) : midiToVexKey(ev.midi).key;
        
        let baseDur;
        if (ev.tripletGroup) {
            if (ev.tripletGroup === 2) baseDur = 'q';
            else if (ev.tripletGroup === 1) baseDur = '8';
            else baseDur = '16';
        } else {
            baseDur = durToVexCode(ev.durQuarters);
        }

        const durCode = baseDur + (ev.isRest ? 'r' : '');
        const noteOpts = { keys:[vexKey], duration: durCode, clef: state.clef, auto_stem: true };
        
        if(ev.isGhost && !ev.isRest) noteOpts.type = 'x';
        const note = new VF.StaveNote(noteOpts);
        
        if(ev.isDotted) {
            addNoteModifier(note, new VF.Dot(), 0);
        }
        if(!ev.isRest && ev.isStaccato) {
            const art = new VF.Articulation('a.');
            art.setPosition(3); 
            addNoteModifier(note, art, 0);
        }
        if(ev.chordSymbol && !ev.isRest) {
            const anno = new VF.Annotation(ev.chordSymbol);
            anno.setFont('sans-serif', 12, 'bold');
            anno.setVerticalJustification(1); 
            addNoteModifier(note, anno, 0);
        }
        
        ev._vexNote = note; 
        vexNotes.push(note);
        allVexNotes.push(ev); 
        
        if(ev.tripletGroup) { 
            curTripletGroup.push(ev);
            curTripletDur += ev.durQuarters; 
            
            if(curTripletDur >= 0.99) {
                const notes = curTripletGroup.map(e => e._vexNote);
                
                tuplets.push(new VF.Tuplet(notes, { num_notes: 3, notes_occupied: 2 }));
                
                const realEvents = curTripletGroup.filter(e => !e.isRest);
                const allShort = curTripletGroup.every(e => e.tripletGroup <= 1);
                
                if (realEvents.length >= 1 && allShort) {
                    if (realEvents.length >= 2) {
                        const centerMidi = getCenterMidiForClef(state.clef);
                        let maxMidi = -100, minMidi = 200;
                        realEvents.forEach(e => {
                            if (e.midi > maxMidi) maxMidi = e.midi;
                            if (e.midi < minMidi) minMidi = e.midi;
                        });
                        const stemDir = (maxMidi + minMidi) / 2 >= centerMidi ? -1 : 1;
                        curTripletGroup.forEach(e => {
                            if (!e.isRest) e._vexNote.setStemDirection(stemDir);
                        });
                    }
                    
                    // CORREÇÃO: Apara as pausas das extremidades ANTES de desenhar as hastes (beams) nas quiálteras
                    let start = 0; while(start < curTripletGroup.length && curTripletGroup[start].isRest) start++;
                    let end = curTripletGroup.length - 1; while(end >= 0 && curTripletGroup[end].isRest) end--;
                    if (end > start) {
                        const beamEvents = curTripletGroup.slice(start, end + 1);
                        beams.push(new VF.Beam(beamEvents.map(e => e._vexNote)));
                    }
                }
                
                curTripletGroup = []; 
                curTripletDur = 0;
            } 
        } 
        else if (ev.durQuarters < 1.0) {
            const beatIndex = Math.floor(currentBeat);
            if (!beatGroups[beatIndex]) beatGroups[beatIndex] = [];
            beatGroups[beatIndex].push(ev);
        }
        currentBeat += ev.durQuarters;
      });

      Object.values(beatGroups).forEach(group => {
          let start = 0; while(start < group.length && group[start].isRest) start++;
          let end = group.length - 1; while(end >= 0 && group[end].isRest) end--;
          
          if (end > start) { 
              const beamEvents = group.slice(start, end + 1);
              const realEvents = beamEvents.filter(e => !e.isRest);
              
              if (realEvents.length >= 2) {
                  const centerMidi = getCenterMidiForClef(state.clef);
                  let maxMidi = -100, minMidi = 200;
                  realEvents.forEach(e => {
                      if (e.midi > maxMidi) maxMidi = e.midi;
                      if (e.midi < minMidi) minMidi = e.midi;
                  });
                  const stemDir = (maxMidi + minMidi) / 2 >= centerMidi ? -1 : 1;
                  beamEvents.forEach(e => e._vexNote.setStemDirection(stemDir));
                  beams.push(new VF.Beam(beamEvents.map(e => e._vexNote)));
              }
          }
      });

      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false); 
      voice.addTickables(vexNotes);
      try{ VF.Accidental.applyAccidentals([voice], state.keyInfo.vexKey); }catch(e){}
      new VF.Formatter().joinVoices([voice]).format([voice], LOGICAL_MEASURE_PX - 30);

      voice.draw(ctx, stave);
      beams.forEach(b => b.setContext(ctx).draw()); 
      tuplets.forEach(t => t.setContext(ctx).draw());
  });

  for(let i=0; i<allVexNotes.length-1; i++){
    if(allVexNotes[i].tieToNext && !allVexNotes[i].isRest && !allVexNotes[i+1].isRest){
        new VF.StaveTie({ 
            first_note: allVexNotes[i]._vexNote, 
            last_note: allVexNotes[i+1]._vexNote, 
            first_indices:[0], last_indices:[0] 
        }).setContext(ctx).draw();
    }
  }
}

function renderClefPanel(){
  const VF = Vex.Flow, holder = document.createElement('div'), renderer = new VF.Renderer(holder, VF.Renderer.Backends.SVG);
  const logicalWidth = 160; renderer.resize(logicalWidth * SCALE, 150 * SCALE);
  const ctx = renderer.getContext(); ctx.scale(SCALE, SCALE);
  ctx.setFillStyle(getComputedStyle(document.documentElement).getPropertyValue('--text-0').trim() || '#e9ecf1');
  ctx.setStrokeStyle(getComputedStyle(document.documentElement).getPropertyValue('--staff').trim() || '#8a93a3');
  const stave = new VF.Stave(0, 10, logicalWidth); 
  stave.addClef(state.clef); stave.addKeySignature(state.keyInfo.vexKey); stave.setContext(ctx).draw();
  const cp = document.getElementById('clefpanel');
  if (cp) { cp.innerHTML = ''; cp.appendChild(holder.firstChild); }
}

/**
 * ==========================================================================
 * MÓDULO 10: MOTOR DE ANIMAÇÃO E GERENCIAMENTO DA ESTEIRA
 * ==========================================================================
 */
const scoreScroll = document.getElementById('score-scroll');
const PLAYHEAD_X = 240; 
const ph = document.getElementById('playhead');
if(ph) ph.style.left = PLAYHEAD_X + 'px';

let measures = []; let cumulativeBeats = 0; let globalEventTimeline = []; 
let rafId = null; let anchorTime = 0; let anchorBeat = 0;  

function getBeatFromTime(t) { return anchorBeat + (t - anchorTime) * (state.bpm / 60); }
function getTimeFromBeat(b) { return anchorTime + (b - anchorBeat) * (60 / state.bpm); }

function clearTrack(){
  if(scoreScroll) scoreScroll.innerHTML = ''; 
  measures = []; cumulativeBeats = 0; globalEventTimeline = [];
  lastMidi = null; pendingTieMidi = null; grooveState.pattern = null; grooveState.measureInCycle = 0;
  seqIndex = 0; seqStep = 0; seqDir = 1; pedalIsRoot = true; pedalScaleIdx = 0; pedalDir = 1;
}

function generateAndScheduleNextBlock(){
  const blockEvents = buildBlock(); 
  
  const div = document.createElement('div'); div.className = 'measure'; 
  const leftPx = PLAYHEAD_X + cumulativeBeats * PX_PER_QUARTER; 
  div.style.left = leftPx + 'px'; 
  if(scoreScroll) scoreScroll.appendChild(div);
  
  renderBlockSVG(div, blockEvents);

  let cursorBeat = cumulativeBeats;
  for (const events of blockEvents) {
      for(const ev of events){
        if(!ev.isRest && ev.midi != null){
          if(ev.tiedFromPrev && globalEventTimeline.length > 0) {
              globalEventTimeline[globalEventTimeline.length - 1].durBeats += ev.durQuarters;
          } else {
              globalEventTimeline.push({ beat: cursorBeat, durBeats: ev.durQuarters, midi: ev.midi, opts: { isGhost: ev.isGhost, isStaccato: ev.isStaccato }, scheduled: false });
          }
        }
        cursorBeat += ev.durQuarters;
      }
  }
  
  measures.push({ div, leftPx, startBeat: cumulativeBeats }); 
  cumulativeBeats += MEASURE_BEATS * MEASURES_PER_BLOCK; 
}

function ensureBuffer(currentBeat){ while(cumulativeBeats < currentBeat + 32) generateAndScheduleNextBlock(); }

function pruneOffscreen(scrollBeats){ 
    while(measures.length && (measures[0].startBeat + 16) * PX_PER_QUARTER < (scrollBeats*PX_PER_QUARTER) - PLAYHEAD_X - 50) {
        measures.shift().div.remove(); 
    }
}

function animationLoop(){
  if(!state.playing || state.paused) return; 
  const currentBeat = getBeatFromTime(audioCtx.currentTime); 
  const activeBeat = Math.max(0, currentBeat); 
  
  if(scoreScroll) scoreScroll.style.transform = `translateX(${-activeBeat * PX_PER_QUARTER}px)`;
  ensureBuffer(activeBeat); pruneOffscreen(activeBeat + PLAYHEAD_X/PX_PER_QUARTER);
  
  const flash = document.getElementById('countin-flash');
  if(flash) {
      if(currentBeat < 0){ 
          flash.textContent = Math.floor(currentBeat) + 5; 
          flash.classList.add('show'); 
      } else { flash.classList.remove('show'); }
  }
  
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = currentBeat < 0 ? 'contagem...' : `compasso ${Math.floor(activeBeat/4)+1}`;
  
  rafId = requestAnimationFrame(animationLoop);
}

/**
 * ==========================================================================
 * MÓDULO 11: SCHEDULER DE ÁUDIO WEB API
 * ==========================================================================
 */
let audioCtx = null, masterGain = null, scheduledNodes = [];
let audioSchedulerId = null, lastScheduledMetroBeat = -1;

function ensureAudio(){
  if(!audioCtx){ 
      audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
      masterGain = audioCtx.createGain(); masterGain.gain.value = 0.9; masterGain.connect(audioCtx.destination); 
  }
  if(audioCtx.state === 'suspended') audioCtx.resume();
}
function stopAllAudioNodes() { scheduledNodes.forEach(n => { try{ n.stop(); }catch(e){} }); scheduledNodes.length = 0; }

function playClick(time, accent){
  if(!state.clickAudio || state.volClick <= 0) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(); 
  osc.type = 'square'; osc.frequency.value = accent ? 1500 : 1000;
  gain.gain.setValueAtTime(0.0001, time); 
  gain.gain.exponentialRampToValueAtTime((accent ? 0.35 : 0.22) * state.volClick + 0.0001, time+0.002); 
  gain.gain.exponentialRampToValueAtTime(0.0001, time+0.045);
  osc.connect(gain).connect(masterGain); osc.start(time); osc.stop(time+0.05);
  scheduledNodes.push(osc); osc.onended = () => { const i = scheduledNodes.indexOf(osc); if(i>-1) scheduledNodes.splice(i,1); };
}

function playBassNote(time, midi, durationSec, opts){
  if(!state.noteAudio || state.volSynth <= 0) return;
  const osc = audioCtx.createOscillator(), filt = audioCtx.createBiquadFilter(), gain = audioCtx.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = 440 * Math.pow(2, (midi-69)/12); filt.type = 'lowpass'; filt.frequency.value = opts.isGhost ? 450 : 1200; filt.Q.value = 0.5;
  
  const actualDuration = (opts.isStaccato || opts.isGhost) ? Math.min(durationSec * 0.3, 0.12) : durationSec * 0.95;
  const attack = 0.01, decay = 0.1;
  const peak = (opts.isGhost ? 0.15 : 0.4) * state.volSynth, sustain = peak * 0.6;

  gain.gain.setValueAtTime(0.0001, time); gain.gain.exponentialRampToValueAtTime(peak + 0.0001, time + attack);
  if (actualDuration > attack + decay) { 
      gain.gain.exponentialRampToValueAtTime(sustain + 0.0001, time + attack + decay); gain.gain.setValueAtTime(sustain + 0.0001, time + actualDuration - 0.05); gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration); 
  } else { gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration); }
  
  osc.connect(filt).connect(gain).connect(masterGain); osc.start(time); osc.stop(time + actualDuration + 0.1);
  scheduledNodes.push(osc); osc.onended = () => { const i = scheduledNodes.indexOf(osc); if(i>-1) scheduledNodes.splice(i,1); };
}

function audioTick(){
  if(!state.playing || state.paused) return;
  const now = audioCtx.currentTime, lookaheadBeat = getBeatFromTime(now + 0.2); 
  
  for(let i=0; i<globalEventTimeline.length; i++){
    const note = globalEventTimeline[i];
    if(!note.scheduled && note.beat <= lookaheadBeat){ note.scheduled = true; const pt = getTimeFromBeat(note.beat); if(pt >= now - 0.05) playBassNote(pt, note.midi, note.durBeats * (60/state.bpm), note.opts); }
  }
  
  while( lastScheduledMetroBeat + 1 <= lookaheadBeat ){ lastScheduledMetroBeat++; const pt = getTimeFromBeat(lastScheduledMetroBeat); if(pt >= now - 0.05) playClick(pt, lastScheduledMetroBeat % 4 === 0); }
}

/**
 * ==========================================================================
 * MÓDULO 12: SISTEMA DE TRANSPORTE E BINDINGS FINAIS
 * ==========================================================================
 */
function updatePlayButtonUI() {
    const btn = document.getElementById('playPauseBtn');
    if(!btn) return;
    if (state.playing && !state.paused) {
        btn.innerHTML = '<span class="icon">⏸</span> Pausar';
        btn.className = 'transport-btn btn-orange'; 
    } else {
        btn.innerHTML = '<span class="icon">▶</span> ' + (state.paused ? 'Continuar' : 'Iniciar');
        btn.className = 'transport-btn btn-green'; 
    }
}

function startPlayback(){
  ensureAudio(); clearTrack(); state.playing = true; state.paused = false;
  updatePlayButtonUI(); 
  const stopB = document.getElementById('stopBtn'); if(stopB) stopB.disabled = false;
  const ws = document.getElementById('welcome-screen'); if(ws) ws.classList.add('hidden');
  
  anchorBeat = state.countIn ? -4 : 0; anchorTime = audioCtx.currentTime + 0.1; lastScheduledMetroBeat = anchorBeat - 1;
  ensureBuffer(0); if(audioSchedulerId) clearInterval(audioSchedulerId); audioSchedulerId = setInterval(audioTick, 50); rafId = requestAnimationFrame(animationLoop);
}

function togglePause() {
  if (!state.playing) return;
  if (state.paused) {
    state.paused = false; anchorTime += (audioCtx.currentTime - state.pauseTime); 
    updatePlayButtonUI();
    rafId = requestAnimationFrame(animationLoop);
  } else {
    state.paused = true; state.pauseTime = audioCtx.currentTime; stopAllAudioNodes(); cancelAnimationFrame(rafId);
    const cb = getBeatFromTime(state.pauseTime); globalEventTimeline.forEach(note => { if (note.beat > cb - 0.1) note.scheduled = false; }); 
    lastScheduledMetroBeat = Math.floor(cb);
    updatePlayButtonUI(); 
    const st = document.getElementById('status'); if(st) st.textContent = 'pausado';
  }
}

function stopPlayback(){
  state.playing = false; state.paused = false;
  updatePlayButtonUI(); 
  const stopB = document.getElementById('stopBtn'); if(stopB) stopB.disabled = true;
  const ws = document.getElementById('welcome-screen'); if(ws) ws.classList.remove('hidden');
  
  if(rafId) cancelAnimationFrame(rafId); if(audioSchedulerId) clearInterval(audioSchedulerId);
  const flash = document.getElementById('countin-flash'); if(flash) flash.classList.remove('show'); 
  const st = document.getElementById('status'); if(st) st.textContent = 'pronto';
  
  stopAllAudioNodes(); 
  if(scoreScroll) scoreScroll.style.transform = 'translateX(0px)'; 
  clearTrack();
}

function applyBpm(newBpm){
  const nextBpm = Math.max(30, Math.min(220, parseInt(newBpm,10) || state.bpm));
  if(state.playing && !state.paused) { const now = audioCtx.currentTime; anchorBeat = getBeatFromTime(now); anchorTime = now; } 
  else if (state.paused) { anchorBeat = getBeatFromTime(state.pauseTime); anchorTime = state.pauseTime; }
  state.bpm = nextBpm; 
  const bS = document.getElementById('bpmSlider'); if(bS) bS.value = nextBpm; 
  const bR = document.getElementById('bpmReadout'); if(bR) bR.value = nextBpm;
}

safeAddListener('playPauseBtn', 'click', () => state.playing ? togglePause() : startPlayback() );
safeAddListener('stopBtn', 'click', () => { if(state.playing) stopPlayback(); });

function setupHoldButton(id, delta) {
    const btn = document.getElementById(id);
    if (!btn) return;
    let timer = null, timeout = null;
    
    const start = (e) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        applyBpm(state.bpm + delta);
        timeout = setTimeout(() => {
            timer = setInterval(() => applyBpm(state.bpm + delta), 80); 
        }, 300); 
    };
    
    const stop = (e) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        clearTimeout(timeout);
        clearInterval(timer);
    };
    
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    
    btn.addEventListener('touchstart', start, {passive: false});
    btn.addEventListener('touchend', stop, {passive: false});
    btn.addEventListener('touchcancel', stop, {passive: false});
}

setupHoldButton('bpmDec', -1);
setupHoldButton('bpmInc', 1);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { 
    e.preventDefault(); 
    if(document.activeElement) document.activeElement.blur(); 
    state.playing ? togglePause() : startPlayback(); 
  }
});

const bpmSlider = document.getElementById('bpmSlider'), bpmReadout = document.getElementById('bpmReadout');
if(bpmSlider) bpmSlider.addEventListener('input', () => applyBpm(bpmSlider.value)); 
if(bpmReadout) bpmReadout.addEventListener('change', () => applyBpm(bpmReadout.value));

function wireToggle(id, key){ 
    const b = document.getElementById(id); 
    if(!b) return;
    b.addEventListener('click', () => { state[key] = !state[key]; b.classList.toggle('on', state[key]); }); 
}
wireToggle('countInBtn','countIn'); wireToggle('noteAudioBtn','noteAudio'); wireToggle('clickAudioBtn','clickAudio');

} // fim initApp()
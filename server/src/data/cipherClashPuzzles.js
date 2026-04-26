// Cipher Clash — Puzzle Pool
export const cipherClashPuzzles = [
  // ─── CAESAR ───
  {id:'c1',type:'caesar',encoded:'KHOOR ZRUOG',decoded:'HELLO WORLD',shift:3,difficulty:1,hint:'Shift each letter back by 3',timeLimit:30},
  {id:'c2',type:'caesar',encoded:'FDHVDU FLSKHU',decoded:'CAESAR CIPHER',shift:3,difficulty:1,hint:'Classic shift cipher',timeLimit:30},
  {id:'c3',type:'caesar',encoded:'SURJUDPPLQJ',decoded:'PROGRAMMING',shift:3,difficulty:1,hint:'A common developer activity',timeLimit:25},
  {id:'c4',type:'caesar',encoded:'MFUUBHWXHVW',decoded:'CIPHERQUEST',shift:10,difficulty:2,hint:'Higher shift value',timeLimit:35},
  {id:'c5',type:'caesar',encoded:'YNLQJ UXOH',decoded:'DYING RULE',shift:10,difficulty:2,hint:'Shift = 10',timeLimit:35},
  {id:'c6',type:'caesar',encoded:'LIPPS ASVPH',decoded:'HELLO WORLD',shift:4,difficulty:1,hint:'Shift by 4',timeLimit:30},
  {id:'c7',type:'caesar',encoded:'WKLV LV D WHVW',decoded:'THIS IS A TEST',shift:3,difficulty:1,hint:'Simple sentence',timeLimit:25},
  {id:'c8',type:'caesar',encoded:'FRGH DUHQD',decoded:'CODE ARENA',shift:3,difficulty:1,hint:'Our platform name!',timeLimit:20},
  // ─── BINARY ───
  {id:'b1',type:'binary',encoded:'01001000 01001001',decoded:'HI',difficulty:1,hint:'8-bit ASCII codes',timeLimit:30},
  {id:'b2',type:'binary',encoded:'01000010 01010101 01000111',decoded:'BUG',difficulty:1,hint:'3 bytes, a common coding problem',timeLimit:35},
  {id:'b3',type:'binary',encoded:'01000011 01001111 01000100 01000101',decoded:'CODE',difficulty:2,hint:'What we write every day',timeLimit:40},
  {id:'b4',type:'binary',encoded:'01001000 01000101 01001100 01001100 01001111',decoded:'HELLO',difficulty:2,hint:'A greeting',timeLimit:45},
  {id:'b5',type:'binary',encoded:'01010111 01001001 01001110',decoded:'WIN',difficulty:1,hint:'Goal of every match',timeLimit:30},
  {id:'b6',type:'binary',encoded:'01000001 01010000 01001001',decoded:'API',difficulty:1,hint:'Application interface',timeLimit:30},
  {id:'b7',type:'binary',encoded:'01001010 01010011',decoded:'JS',difficulty:1,hint:'A programming language',timeLimit:25},
  {id:'b8',type:'binary',encoded:'01010011 01010001 01001100',decoded:'SQL',difficulty:1,hint:'Database language',timeLimit:30},
  // ─── MORSE ───
  {id:'m1',type:'morse',encoded:'.... . .-.. .-.. ---',decoded:'HELLO',difficulty:1,hint:'Dots and dashes, a greeting',timeLimit:35},
  {id:'m2',type:'morse',encoded:'... --- ...',decoded:'SOS',difficulty:1,hint:'Emergency signal',timeLimit:20},
  {id:'m3',type:'morse',encoded:'-.-. --- -.. .',decoded:'CODE',difficulty:1,hint:'What developers write',timeLimit:30},
  {id:'m4',type:'morse',encoded:'.-. . .- -.-. -',decoded:'REACT',difficulty:2,hint:'A JS framework',timeLimit:40},
  {id:'m5',type:'morse',encoded:'-. --- -.. .',decoded:'NODE',difficulty:1,hint:'Server runtime',timeLimit:30},
  {id:'m6',type:'morse',encoded:'.... .- -.-. -.-',decoded:'HACK',difficulty:2,hint:'Security term',timeLimit:35},
  {id:'m7',type:'morse',encoded:'-.. .- - .-',decoded:'DATA',difficulty:1,hint:'Information',timeLimit:30},
  {id:'m8',type:'morse',encoded:'--. .- -- .',decoded:'GAME',difficulty:1,hint:'What we play',timeLimit:25},
  // ─── HEX ───
  {id:'h1',type:'hex',encoded:'48 45 4C 4C 4F',decoded:'HELLO',difficulty:1,hint:'Hexadecimal ASCII',timeLimit:35},
  {id:'h2',type:'hex',encoded:'42 55 47',decoded:'BUG',difficulty:1,hint:'3 hex bytes',timeLimit:25},
  {id:'h3',type:'hex',encoded:'4A 41 56 41',decoded:'JAVA',difficulty:2,hint:'A programming language',timeLimit:35},
  {id:'h4',type:'hex',encoded:'50 59 54 48 4F 4E',decoded:'PYTHON',difficulty:2,hint:'Snake language',timeLimit:40},
  {id:'h5',type:'hex',encoded:'48 54 4D 4C',decoded:'HTML',difficulty:1,hint:'Web markup',timeLimit:30},
  {id:'h6',type:'hex',encoded:'52 55 53 54',decoded:'RUST',difficulty:2,hint:'Systems language',timeLimit:35},
  {id:'h7',type:'hex',encoded:'43 53 53',decoded:'CSS',difficulty:1,hint:'Styling language',timeLimit:25},
  {id:'h8',type:'hex',encoded:'41 52 45 4E 41',decoded:'ARENA',difficulty:1,hint:'Battle ground',timeLimit:30},
];

export function getPuzzlesByType(type, count=5) {
  const pool = cipherClashPuzzles.filter(p => p.type === type);
  return [...pool].sort(() => Math.random()-0.5).slice(0, count);
}

export function getRandomPuzzles(count=5) {
  const types = ['caesar','binary','morse','hex'];
  const result = [];
  const perType = Math.ceil(count / types.length);
  for (const t of types) {
    result.push(...getPuzzlesByType(t, perType));
  }
  return [...result].sort(() => Math.random()-0.5).slice(0, count);
}

export function getMixedRound(count=5) {
  const types = ['caesar','binary','morse','hex'];
  const shuffledTypes = [...types].sort(() => Math.random()-0.5);
  const result = [];
  for (let i = 0; i < count; i++) {
    const type = shuffledTypes[i % shuffledTypes.length];
    const puzzles = getPuzzlesByType(type, 1);
    if (puzzles.length) result.push(puzzles[0]);
  }
  return result;
}

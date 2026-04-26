// Bug Bounty Hunter — Question Pool
// Each question has broken code and multiple fix options

const ROOKIE = 'rookie', ELITE = 'elite', LEGEND = 'legend';

export const bugBountyQuestions = [
  // ─── ROOKIE ───
  { id:'r1', difficulty:ROOKIE, title:'Missing Semicolon', language:'javascript',
    code:`function greet(name) {\n  return "Hello, " + name\n}`,
    bug:'Missing semicolon after return statement string concatenation',
    options:[
      {id:'a', text:'Add semicolon after name', correct:true},
      {id:'b', text:'Add parentheses around return value', correct:false},
      {id:'c', text:'Change + to template literal', correct:false},
    ], hint:'Check line endings' },
  { id:'r2', difficulty:ROOKIE, title:'Wrong Comparison', language:'javascript',
    code:`function isAdult(age) {\n  if (age = 18) {\n    return true;\n  }\n  return false;\n}`,
    bug:'Assignment operator used instead of comparison',
    options:[
      {id:'a', text:'Change = to ===', correct:true},
      {id:'b', text:'Change = to !=', correct:false},
      {id:'c', text:'Wrap age in parseInt()', correct:false},
    ], hint:'= vs ==' },
  { id:'r3', difficulty:ROOKIE, title:'Unclosed String', language:'python',
    code:`def greet(name):\n    msg = "Hello, " + name\n    print(msg`,
    bug:'Missing closing parenthesis on print call',
    options:[
      {id:'a', text:'Add ) after msg', correct:true},
      {id:'b', text:'Add ; after msg', correct:false},
      {id:'c', text:'Change print to return', correct:false},
    ], hint:'Count your parentheses' },
  { id:'r4', difficulty:ROOKIE, title:'Off-by-One', language:'javascript',
    code:`const arr = [1,2,3,4,5];\nfor(let i = 0; i <= arr.length; i++) {\n  console.log(arr[i]);\n}`,
    bug:'Loop runs one extra iteration (<=  should be <)',
    options:[
      {id:'a', text:'Change <= to <', correct:true},
      {id:'b', text:'Change i=0 to i=1', correct:false},
      {id:'c', text:'Add break statement', correct:false},
    ], hint:'Array bounds' },
  { id:'r5', difficulty:ROOKIE, title:'Undefined Variable', language:'javascript',
    code:`function sum(a, b) {\n  result = a + b;\n  return reslt;\n}`,
    bug:'Typo in variable name: reslt instead of result',
    options:[
      {id:'a', text:'Change reslt to result', correct:true},
      {id:'b', text:'Add var before result', correct:false},
      {id:'c', text:'Change return to console.log', correct:false},
    ], hint:'Spelling matters' },
  { id:'r6', difficulty:ROOKIE, title:'Wrong Method', language:'javascript',
    code:`const nums = [3,1,4,1,5];\nconst sorted = nums.sort();\nconsole.log(sorted);`,
    bug:'sort() without comparator sorts lexicographically, not numerically',
    options:[
      {id:'a', text:'Use sort((a,b) => a-b)', correct:true},
      {id:'b', text:'Use reverse() instead', correct:false},
      {id:'c', text:'Convert to strings first', correct:false},
    ], hint:'Default sort behavior' },
  { id:'r7', difficulty:ROOKIE, title:'Missing Return', language:'javascript',
    code:`function double(x) {\n  x * 2;\n}`,
    bug:'Missing return keyword',
    options:[
      {id:'a', text:'Add return before x * 2', correct:true},
      {id:'b', text:'Change to arrow function', correct:false},
      {id:'c', text:'Add console.log', correct:false},
    ], hint:'Functions need to return' },
  { id:'r8', difficulty:ROOKIE, title:'Index Error', language:'python',
    code:`names = ["Alice", "Bob"]\nprint(names[2])`,
    bug:'Index 2 is out of range for list of length 2',
    options:[
      {id:'a', text:'Change index to 1', correct:true},
      {id:'b', text:'Add "Charlie" to list', correct:false},
      {id:'c', text:'Use names[-1]', correct:false},
    ], hint:'Indexing starts at 0' },
  { id:'r9', difficulty:ROOKIE, title:'String vs Number', language:'javascript',
    code:`function add(a, b) {\n  return a + b;\n}\nconsole.log(add("5", 3));`,
    bug:'String concatenation instead of addition',
    options:[
      {id:'a', text:'Use Number(a) + Number(b)', correct:true},
      {id:'b', text:'Change + to -', correct:false},
      {id:'c', text:'Add toString()', correct:false},
    ], hint:'Type coercion' },
  { id:'r10', difficulty:ROOKIE, title:'Const Reassign', language:'javascript',
    code:`const count = 0;\nfor(let i = 0; i < 5; i++) {\n  count++;\n}`,
    bug:'Cannot reassign const variable',
    options:[
      {id:'a', text:'Change const to let', correct:true},
      {id:'b', text:'Use count += 1', correct:false},
      {id:'c', text:'Remove the loop', correct:false},
    ], hint:'const vs let' },

  // ─── ELITE ───
  { id:'e1', difficulty:ELITE, title:'Closure Trap', language:'javascript',
    code:`for(var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}`,
    bug:'var creates function scope — all callbacks share same i (prints 3,3,3)',
    options:[
      {id:'a', text:'Change var to let', correct:true},
      {id:'b', text:'Add clearTimeout', correct:false},
      {id:'c', text:'Change 100 to 0', correct:false},
    ], hint:'var vs let scoping' },
  { id:'e2', difficulty:ELITE, title:'Async Await Missing', language:'javascript',
    code:`async function fetchUser() {\n  const res = fetch("/api/user");\n  const data = res.json();\n  return data;\n}`,
    bug:'Missing await on fetch and .json() calls',
    options:[
      {id:'a', text:'Add await before fetch() and res.json()', correct:true},
      {id:'b', text:'Remove async keyword', correct:false},
      {id:'c', text:'Use .then() chains', correct:false},
    ], hint:'Promises need awaiting' },
  { id:'e3', difficulty:ELITE, title:'Shallow Copy', language:'javascript',
    code:`const original = {a:1, b:{c:2}};\nconst copy = {...original};\ncopy.b.c = 99;\nconsole.log(original.b.c);`,
    bug:'Spread only shallow copies — nested objects are shared references',
    options:[
      {id:'a', text:'Use JSON.parse(JSON.stringify(original))', correct:true},
      {id:'b', text:'Use Object.assign', correct:false},
      {id:'c', text:'Change to copy.b = {c:99}', correct:false},
    ], hint:'Nested object references' },
  { id:'e4', difficulty:ELITE, title:'Array Mutation', language:'javascript',
    code:`function removeLast(arr) {\n  arr.pop();\n  return arr;\n}\nconst nums = [1,2,3];\nconst result = removeLast(nums);\nconsole.log(nums);`,
    bug:'pop() mutates the original array',
    options:[
      {id:'a', text:'Use arr.slice(0,-1) instead of pop()', correct:true},
      {id:'b', text:'Add return [...arr]', correct:false},
      {id:'c', text:'Use shift() instead', correct:false},
    ], hint:'Mutation vs immutability' },
  { id:'e5', difficulty:ELITE, title:'Promise Error', language:'javascript',
    code:`function getData() {\n  return new Promise((resolve) => {\n    fetch("/api").then(r => r.json()).then(resolve);\n  });\n}`,
    bug:'Missing reject handler — errors are swallowed',
    options:[
      {id:'a', text:'Add reject param and .catch(reject)', correct:true},
      {id:'b', text:'Add try/catch inside', correct:false},
      {id:'c', text:'Remove the Promise wrapper', correct:false},
    ], hint:'Error handling in promises' },
  { id:'e6', difficulty:ELITE, title:'This Context', language:'javascript',
    code:`const obj = {\n  name: "Arena",\n  greet: function() {\n    setTimeout(function() {\n      console.log("Hello " + this.name);\n    }, 100);\n  }\n};`,
    bug:'Regular function in setTimeout loses this context',
    options:[
      {id:'a', text:'Use arrow function in setTimeout', correct:true},
      {id:'b', text:'Add "use strict"', correct:false},
      {id:'c', text:'Change to obj.name', correct:false},
    ], hint:'Arrow functions inherit this' },
  { id:'e7', difficulty:ELITE, title:'Map Return', language:'javascript',
    code:`const nums = [1,2,3];\nconst doubled = nums.map(n => {\n  n * 2;\n});`,
    bug:'Arrow function with braces needs explicit return',
    options:[
      {id:'a', text:'Add return before n * 2', correct:true},
      {id:'b', text:'Use forEach instead', correct:false},
      {id:'c', text:'Remove the braces', correct:false},
    ], hint:'Implicit vs explicit return' },
  { id:'e8', difficulty:ELITE, title:'Race Condition', language:'javascript',
    code:`let counter = 0;\nasync function increment() {\n  const val = counter;\n  await delay(10);\n  counter = val + 1;\n}`,
    bug:'Read-modify-write with await creates race condition',
    options:[
      {id:'a', text:'Use atomic increment: counter++', correct:true},
      {id:'b', text:'Add try/catch', correct:false},
      {id:'c', text:'Remove await', correct:false},
    ], hint:'Shared state + async = danger' },
  { id:'e9', difficulty:ELITE, title:'Null Check', language:'javascript',
    code:`function getName(user) {\n  return user.profile.name;\n}`,
    bug:'No null check on user or user.profile',
    options:[
      {id:'a', text:'Use optional chaining: user?.profile?.name', correct:true},
      {id:'b', text:'Add typeof check', correct:false},
      {id:'c', text:'Wrap in try/catch', correct:false},
    ], hint:'Defensive programming' },
  { id:'e10', difficulty:ELITE, title:'Event Leak', language:'javascript',
    code:`useEffect(() => {\n  window.addEventListener("resize", handler);\n}, []);`,
    bug:'Missing cleanup — event listener never removed',
    options:[
      {id:'a', text:'Return cleanup: () => window.removeEventListener("resize", handler)', correct:true},
      {id:'b', text:'Add handler to dependency array', correct:false},
      {id:'c', text:'Use useCallback for handler', correct:false},
    ], hint:'useEffect cleanup' },

  // ─── LEGEND ───
  { id:'l1', difficulty:LEGEND, title:'Prototype Pollution', language:'javascript',
    code:`function merge(target, source) {\n  for(const key in source) {\n    target[key] = source[key];\n  }\n  return target;\n}`,
    bug:'No hasOwnProperty check — prototype pollution vulnerability',
    options:[
      {id:'a', text:'Add if(source.hasOwnProperty(key)) guard', correct:true},
      {id:'b', text:'Use Object.assign instead', correct:false},
      {id:'c', text:'Add "use strict"', correct:false},
    ], hint:'Security: prototype chain' },
  { id:'l2', difficulty:LEGEND, title:'Memory Leak', language:'javascript',
    code:`class Cache {\n  constructor() { this.data = new Map(); }\n  set(key, val) { this.data.set(key, val); }\n  get(key) { return this.data.get(key); }\n}`,
    bug:'Cache grows unbounded — no eviction strategy',
    options:[
      {id:'a', text:'Add max size check and LRU eviction in set()', correct:true},
      {id:'b', text:'Use WeakMap instead', correct:false},
      {id:'c', text:'Add delete method', correct:false},
    ], hint:'Unbounded growth' },
  { id:'l3', difficulty:LEGEND, title:'Deadlock Pattern', language:'javascript',
    code:`async function transferFunds(from, to, amount) {\n  await from.lock();\n  await to.lock();\n  from.balance -= amount;\n  to.balance += amount;\n  from.unlock();\n  to.unlock();\n}`,
    bug:'If two transfers happen simultaneously in opposite directions, deadlock occurs',
    options:[
      {id:'a', text:'Always lock accounts in consistent order (e.g. by ID)', correct:true},
      {id:'b', text:'Add timeout to locks', correct:false},
      {id:'c', text:'Remove locks entirely', correct:false},
    ], hint:'Lock ordering prevents deadlock' },
  { id:'l4', difficulty:LEGEND, title:'XSS Vulnerability', language:'javascript',
    code:`app.get("/search", (req, res) => {\n  const q = req.query.q;\n  res.send("<h1>Results for: " + q + "</h1>");\n});`,
    bug:'User input directly interpolated into HTML — XSS attack vector',
    options:[
      {id:'a', text:'Escape/sanitize q before inserting into HTML', correct:true},
      {id:'b', text:'Use POST instead of GET', correct:false},
      {id:'c', text:'Add CORS headers', correct:false},
    ], hint:'Never trust user input' },
  { id:'l5', difficulty:LEGEND, title:'Floating Point', language:'javascript',
    code:`function calculateTotal(price, tax) {\n  return price + (price * tax);\n}\nconsole.log(calculateTotal(0.1, 0.2));`,
    bug:'Floating point precision: 0.1 + 0.02 !== 0.12 exactly',
    options:[
      {id:'a', text:'Use Math.round or toFixed for currency calculations', correct:true},
      {id:'b', text:'Convert to string first', correct:false},
      {id:'c', text:'Use parseInt', correct:false},
    ], hint:'IEEE 754 floating point' },
  { id:'l6', difficulty:LEGEND, title:'SQL Injection', language:'javascript',
    code:`app.post("/login", (req, res) => {\n  const query = "SELECT * FROM users WHERE name='" + req.body.name + "'";\n  db.execute(query);\n});`,
    bug:'String concatenation in SQL query allows injection',
    options:[
      {id:'a', text:'Use parameterized queries with placeholders', correct:true},
      {id:'b', text:'Add input length validation', correct:false},
      {id:'c', text:'Escape single quotes', correct:false},
    ], hint:'Parameterized queries' },
  { id:'l7', difficulty:LEGEND, title:'Regex DoS', language:'javascript',
    code:`const emailRegex = /^([a-zA-Z0-9]+)*@[a-zA-Z0-9]+\\.[a-zA-Z]+$/;\nfunction validate(email) {\n  return emailRegex.test(email);\n}`,
    bug:'Nested quantifier ()+* causes catastrophic backtracking on crafted input',
    options:[
      {id:'a', text:'Remove nested quantifier: use [a-zA-Z0-9]+ without outer group', correct:true},
      {id:'b', text:'Add timeout', correct:false},
      {id:'c', text:'Use indexOf instead', correct:false},
    ], hint:'ReDoS — backtracking regex' },
  { id:'l8', difficulty:LEGEND, title:'TOCTOU Race', language:'javascript',
    code:`async function writeIfNotExists(path, data) {\n  if (!fs.existsSync(path)) {\n    await fs.promises.writeFile(path, data);\n  }\n}`,
    bug:'Time-of-check to time-of-use race — file could be created between check and write',
    options:[
      {id:'a', text:'Use fs.writeFile with wx flag (exclusive create)', correct:true},
      {id:'b', text:'Add a lock file', correct:false},
      {id:'c', text:'Use synchronous writeFileSync', correct:false},
    ], hint:'Atomic file operations' },
  { id:'l9', difficulty:LEGEND, title:'Goroutine Leak', language:'javascript',
    code:`function processItems(items) {\n  return items.map(item => {\n    return new Promise(resolve => {\n      heavyCompute(item).then(resolve);\n    });\n  });\n}`,
    bug:'Anti-pattern: wrapping Promise in new Promise (constructor anti-pattern) + no error handling',
    options:[
      {id:'a', text:'Return heavyCompute(item) directly without wrapping', correct:true},
      {id:'b', text:'Add Promise.all around the map', correct:false},
      {id:'c', text:'Use async/await instead', correct:false},
    ], hint:'Promise constructor anti-pattern' },
  { id:'l10', difficulty:LEGEND, title:'Integer Overflow', language:'javascript',
    code:`function factorial(n) {\n  let result = 1;\n  for(let i = 2; i <= n; i++) {\n    result *= i;\n  }\n  return result;\n}`,
    bug:'Result exceeds Number.MAX_SAFE_INTEGER for large n — silent precision loss',
    options:[
      {id:'a', text:'Use BigInt for large factorials', correct:true},
      {id:'b', text:'Add overflow check', correct:false},
      {id:'c', text:'Use recursion instead', correct:false},
    ], hint:'Number.MAX_SAFE_INTEGER' },
];

export function getQuestionsByDifficulty(difficulty, count = 5) {
  const pool = bugBountyQuestions.filter(q => q.difficulty === difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomQuestions(count = 5) {
  const shuffled = [...bugBountyQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getProgressiveQuestions(count = 5) {
  const r = getQuestionsByDifficulty(ROOKIE, Math.ceil(count * 0.4));
  const e = getQuestionsByDifficulty(ELITE, Math.ceil(count * 0.4));
  const l = getQuestionsByDifficulty(LEGEND, Math.ceil(count * 0.2));
  return [...r, ...e, ...l].slice(0, count);
}

// Algorithm Arena — Challenge Pool
export const algorithmChallenges = [
  // ─── SORTING ───
  { id:'s1', category:'sorting', title:'Bubble to Quick', difficulty:2,
    problem:'Sort an array of integers efficiently',
    slowCode:`function sort(arr) {\n  for(let i=0;i<arr.length;i++)\n    for(let j=0;j<arr.length-1;j++)\n      if(arr[j]>arr[j+1]) [arr[j],arr[j+1]]=[arr[j+1],arr[j]];\n  return arr;\n}`,
    options:[
      {id:'a',label:'Use Array.sort((a,b)=>a-b)',complexity:'O(n log n)',correct:true},
      {id:'b',label:'Add early termination flag',complexity:'O(n²) best O(n)',correct:false},
      {id:'c',label:'Use selection sort',complexity:'O(n²)',correct:false},
    ], explanation:'Built-in sort uses TimSort — O(n log n) average' },
  { id:'s2', category:'sorting', title:'Find Kth Largest', difficulty:3,
    problem:'Find the kth largest element without full sort',
    slowCode:`function kthLargest(arr, k) {\n  arr.sort((a,b)=>b-a);\n  return arr[k-1];\n}`,
    options:[
      {id:'a',label:'Use QuickSelect algorithm',complexity:'O(n) avg',correct:true},
      {id:'b',label:'Use min-heap of size k',complexity:'O(n log k)',correct:false},
      {id:'c',label:'Sort ascending instead',complexity:'O(n log n)',correct:false},
    ], explanation:'QuickSelect achieves O(n) average without full sort' },
  { id:'s3', category:'sorting', title:'Merge Sorted Arrays', difficulty:1,
    problem:'Merge two sorted arrays into one sorted array',
    slowCode:`function merge(a, b) {\n  return [...a, ...b].sort((x,y)=>x-y);\n}`,
    options:[
      {id:'a',label:'Two-pointer merge technique',complexity:'O(n+m)',correct:true},
      {id:'b',label:'Concatenate then insertion sort',complexity:'O((n+m)²)',correct:false},
      {id:'c',label:'Binary search insert',complexity:'O(n log m)',correct:false},
    ], explanation:'Two-pointer merge runs in O(n+m) time, O(n+m) space' },
  { id:'s4', category:'sorting', title:'Count Inversions', difficulty:3,
    problem:'Count pairs where i<j but arr[i]>arr[j]',
    slowCode:`function countInv(arr) {\n  let c=0;\n  for(let i=0;i<arr.length;i++)\n    for(let j=i+1;j<arr.length;j++)\n      if(arr[i]>arr[j]) c++;\n  return c;\n}`,
    options:[
      {id:'a',label:'Modified merge sort counting',complexity:'O(n log n)',correct:true},
      {id:'b',label:'Use a BST',complexity:'O(n log n)',correct:false},
      {id:'c',label:'Use hash map',complexity:'O(n)',correct:false},
    ], explanation:'Merge sort can count inversions during merge step' },
  { id:'s5', category:'sorting', title:'Sort Colors', difficulty:1,
    problem:'Sort array of 0s, 1s, 2s in-place',
    slowCode:`function sortColors(nums) {\n  nums.sort((a,b)=>a-b);\n}`,
    options:[
      {id:'a',label:'Dutch National Flag (3-way partition)',complexity:'O(n)',correct:true},
      {id:'b',label:'Counting sort with 3 buckets',complexity:'O(n)',correct:false},
      {id:'c',label:'Two-pass: count then fill',complexity:'O(n)',correct:false},
    ], explanation:'DNF algorithm does it in one pass with O(1) space' },
  // ─── TREES ───
  { id:'t1', category:'trees', title:'Balanced Check', difficulty:2,
    problem:'Check if a binary tree is height-balanced',
    slowCode:`function isBalanced(root) {\n  if(!root) return true;\n  const lh=height(root.left);\n  const rh=height(root.right);\n  return Math.abs(lh-rh)<=1 && isBalanced(root.left) && isBalanced(root.right);\n}`,
    options:[
      {id:'a',label:'Bottom-up: return -1 for unbalanced',complexity:'O(n)',correct:true},
      {id:'b',label:'BFS level-order check',complexity:'O(n)',correct:false},
      {id:'c',label:'Store heights in hashmap',complexity:'O(n) + O(n) space',correct:false},
    ], explanation:'Bottom-up avoids recalculating heights: O(n) vs O(n²)' },
  { id:'t2', category:'trees', title:'LCA Problem', difficulty:2,
    problem:'Find Lowest Common Ancestor of two nodes',
    slowCode:`function lca(root,p,q) {\n  const pathP=findPath(root,p,[]);\n  const pathQ=findPath(root,q,[]);\n  let i=0;\n  while(i<pathP.length && i<pathQ.length && pathP[i]===pathQ[i]) i++;\n  return pathP[i-1];\n}`,
    options:[
      {id:'a',label:'Single recursive pass checking left/right',complexity:'O(n)',correct:true},
      {id:'b',label:'Use parent pointers',complexity:'O(h)',correct:false},
      {id:'c',label:'BFS from both nodes',complexity:'O(n)',correct:false},
    ], explanation:'Recursive LCA: if both sides return non-null, current node is LCA' },
  { id:'t3', category:'trees', title:'Serialize Tree', difficulty:3,
    problem:'Serialize and deserialize a binary tree',
    slowCode:`// Using JSON.stringify on entire tree object\nfunction serialize(root) { return JSON.stringify(root); }`,
    options:[
      {id:'a',label:'Preorder with null markers',complexity:'O(n)',correct:true},
      {id:'b',label:'Level-order BFS encoding',complexity:'O(n)',correct:false},
      {id:'c',label:'Inorder + preorder arrays',complexity:'O(n)',correct:false},
    ], explanation:'Preorder with null markers enables O(n) serialize/deserialize' },
  // ─── DP ───
  { id:'d1', category:'dp', title:'Fibonacci', difficulty:1,
    problem:'Calculate nth Fibonacci number efficiently',
    slowCode:`function fib(n) {\n  if(n<=1) return n;\n  return fib(n-1) + fib(n-2);\n}`,
    options:[
      {id:'a',label:'Iterative with two variables',complexity:'O(n) time, O(1) space',correct:true},
      {id:'b',label:'Memoization with array',complexity:'O(n) time, O(n) space',correct:false},
      {id:'c',label:'Matrix exponentiation',complexity:'O(log n)',correct:false},
    ], explanation:'Iterative approach: O(n) time, O(1) space — no recursion overhead' },
  { id:'d2', category:'dp', title:'Coin Change', difficulty:2,
    problem:'Min coins to make target amount',
    slowCode:`function coinChange(coins,amount) {\n  if(amount===0) return 0;\n  let min=Infinity;\n  for(const c of coins)\n    if(c<=amount) min=Math.min(min,1+coinChange(coins,amount-c));\n  return min;\n}`,
    options:[
      {id:'a',label:'Bottom-up DP table',complexity:'O(amount × coins)',correct:true},
      {id:'b',label:'Greedy largest coin first',complexity:'O(amount)',correct:false},
      {id:'c',label:'BFS shortest path',complexity:'O(amount × coins)',correct:false},
    ], explanation:'DP table avoids exponential recomputation' },
  { id:'d3', category:'dp', title:'Longest Subsequence', difficulty:2,
    problem:'Find length of longest increasing subsequence',
    slowCode:`function lis(arr) {\n  let max=0;\n  // Try all 2^n subsequences\n  for(let mask=0;mask<(1<<arr.length);mask++) {\n    // check if increasing...\n  }\n  return max;\n}`,
    options:[
      {id:'a',label:'DP with binary search (patience sort)',complexity:'O(n log n)',correct:true},
      {id:'b',label:'Classic DP array',complexity:'O(n²)',correct:false},
      {id:'c',label:'Divide and conquer',complexity:'O(n log n)',correct:false},
    ], explanation:'Patience sorting achieves O(n log n) using binary search on tails array' },
  // ─── GRAPHS ───
  { id:'g1', category:'graphs', title:'Shortest Path', difficulty:2,
    problem:'Find shortest path in weighted graph',
    slowCode:`function shortestPath(graph, start, end) {\n  // BFS (ignores weights)\n  const queue = [start];\n  // ...\n}`,
    options:[
      {id:'a',label:"Dijkstra's with min-heap",complexity:'O((V+E) log V)',correct:true},
      {id:'b',label:'Bellman-Ford',complexity:'O(VE)',correct:false},
      {id:'c',label:'Floyd-Warshall',complexity:'O(V³)',correct:false},
    ], explanation:"Dijkstra's is optimal for non-negative weighted shortest path" },
  { id:'g2', category:'graphs', title:'Cycle Detection', difficulty:1,
    problem:'Detect if a directed graph has a cycle',
    slowCode:`function hasCycle(graph) {\n  // Check all paths (exponential)\n}`,
    options:[
      {id:'a',label:'DFS with coloring (white/gray/black)',complexity:'O(V+E)',correct:true},
      {id:'b',label:'Topological sort check',complexity:'O(V+E)',correct:false},
      {id:'c',label:'BFS with in-degree',complexity:'O(V+E)',correct:false},
    ], explanation:'DFS coloring: gray node revisited means cycle. O(V+E)' },
  { id:'g3', category:'graphs', title:'Connected Components', difficulty:1,
    problem:'Count connected components in undirected graph',
    slowCode:`// Nested loops checking all pairs: O(V²)`,
    options:[
      {id:'a',label:'Union-Find (Disjoint Set)',complexity:'O(V α(V))',correct:true},
      {id:'b',label:'DFS/BFS from each unvisited node',complexity:'O(V+E)',correct:false},
      {id:'c',label:'Adjacency matrix multiplication',complexity:'O(V³)',correct:false},
    ], explanation:'Union-Find with path compression is nearly O(1) per operation' },
];

export function getChallengesByCategory(category, count=4) {
  const pool = algorithmChallenges.filter(c => c.category === category);
  return [...pool].sort(() => Math.random()-0.5).slice(0, count);
}

export function getRandomChallenges(count=4) {
  const categories = ['sorting','trees','dp','graphs'];
  const result = [];
  for (const cat of categories) {
    const q = getChallengesByCategory(cat, 1);
    if (q.length) result.push(q[0]);
  }
  while (result.length < count) {
    const extra = [...algorithmChallenges].sort(() => Math.random()-0.5)
      .find(c => !result.find(r => r.id === c.id));
    if (extra) result.push(extra); else break;
  }
  return result.slice(0, count);
}

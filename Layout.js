
function Layout(TB, A) {
	let _range = length => Array.from({ length }).map((v, k) => k);
	let _new_arr_with_v = (length, value) => Array.from({ length }).map((v) => value);
	var transitionTable = TB;
	var alphabet = A;

	var nodesInfo = new Map();
	for (let node of _range(transitionTable.length)) {
		nodesInfo.set(node, {
			prenNodes: [],
			nextNodes: []
		});
	}
	for (let row of _range(transitionTable.length)) {
		for (let col of _range(alphabet.length)) {
			for (let e of transitionTable[row][col]) {
				nodesInfo.get(row).nextNodes.push(e);
				nodesInfo.get(e).prenNodes.push(row);
			}
		}
	}


	var stems = _new_arr_with_v(transitionTable.length, -1);
	var levels = _new_arr_with_v(transitionTable.length, -1);

	var level = -1;
	stems[0] = [0];
	levels[0] = 0;

	function _indexsOf(array, value) {
		let indexes = [];
		array.forEach((e, i) => {
			if (value === e) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}

	function _indexsOf_2(arrayOfarray, value) {
		let indexes = [];
		//console.log(arrayOfarray);
		arrayOfarray.forEach((arr, i) => {
			if (arr === -1) return;
			if (arr.indexOf(value) != -1) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}

	function traceback(node) {
		//  从 0 到达 node 走过的轨迹
		let trace = [node];
		if (node === 0) return trace;
		let preNode = stems[node][0];
		trace.unshift(preNode);
		while (preNode != 0) {
			preNode = stems[preNode][0];
			trace.unshift(preNode);
		}
		// trace.unshift(0);
		return trace;
	}

	function isStemOf(node1, node2) {
		// 判断在遍历图走到 node1 的路上是否经过 node2
		trace_node1 = traceback(node1);
		if (trace_node1.indexOf(node2) === -1) return false;
		else return true;
	}

	function resetLevelsOf(nodes) {
		// 更新 nodes 中所有 node 的 levels， 以及所有 node 后面的点的 levels
		if (typeof nodes === 'number') nodes = [nodes];
		let nextNodes = new Set();
		for (let node of nodes) {
			levels[node] = levelOf(node);
			if (_indexsOf_2(stems, node) != -1) _indexsOf_2(stems, node).forEach(e => nextNodes.add(e));
		}
		if (nextNodes.size != 0) resetLevelsOf([...nextNodes]);
	}

	function levelOf(node) {
		let preNodes = stems[node];
		let max = 0;
		preNodes.forEach(e => {
			if (levels[e] > max) max = levels[e];
		})
		return max + 1;
	}

	function isTraceCover(trace_newone, trace_existone) {
		// 判断 trace_newone 是否 覆盖 trace_existone
		// 是的话就说明 trace_existone 是 trace_newone 的一条捷径
		let isCover = true;
		for (let node of trace_existone) {
			if (trace_newone.indexOf(node) === -1) {
				isCover = false;
				break;
			}
		}
		return isCover;
	}

	while (++level < stems.length) {
		let currentLevel = _indexsOf(levels, level);
		if (currentLevel === -1) break;
		for (let node of currentLevel) {
			let nextNodes = nodesInfo.get(node).nextNodes;
			for (let nextNode of nextNodes) {
				if (levels[nextNode] === -1) {
					// 第一次遇到 node
					stems[nextNode] = [node];
					levels[nextNode] = levels[node] + 1;
				} else {
					// nextNode 已经在某个 level 中
					// 这是 nextNode 的 stems 是有东西的
					if (stems[nextNode].indexOf(node) != -1) {
						// 之前 nextNode 的前置设置正确， 不用做更改
					} else if (isStemOf(node, nextNode)) {
						// 返回边，不理
					} else {
						if (stems[nextNode].length > 1) {
							// 似乎可以肯定 nextNode 是一个并点
							stems[nextNode].push(node);
							resetLevelsOf(node);
						} else {
							// 目前不确定 nextNode 是不是一个并点
							let trace_existone = traceback(nextNode);
							let trace_newone = traceback(node);
							trace_newone.push(nextNode);
							///
							if (isTraceCover(trace_newone, trace_existone)) {
								// nextNode 存在，但是之前设置的 stem 是错的，正解为 node
								stems[nextNode] = [node];
								// 把所有受影响的 node 的 levels 改正确
								// 注意后面的节点的排序目前认为是正确的，故只需要遍历一下改正 level 就 ok 
								resetLevelsOf(nextNode);
							} else {
								// nextNode 是一个并点
								stems[nextNode].push(node);
								resetLevelsOf(nextNode);
							}
						}
					}
				}
			}
		}
	}

	var graph = [];
	var l = 0;
	while (l < level) graph.push(_indexsOf(levels, l++));


	// 辅助数据结构，存储水平排序后每个节点的前后节点信息
	var nodesInfo_H = new Map();
	var branches = [];
	for (let node of _range(stems.length)) {
		nodesInfo_H.set(node, {
			leftNodes: [],
			rightNodes: []
		});
	}
	for (let R_node of _range(stems.length)) {
		for (let L_node of stems[R_node]) {
			nodesInfo_H.get(R_node).leftNodes.push(L_node);
			nodesInfo_H.get(L_node).rightNodes.push(R_node);
		}
	}
	nodesInfo_H.get(0).leftNodes.splice(nodesInfo_H.get(0).leftNodes.indexOf(0), 1);
	nodesInfo_H.get(0).rightNodes.splice(nodesInfo_H.get(0).rightNodes.indexOf(0), 1);

	for (let node of _range(stems.length)) branches.push(nodesInfo_H.get(node).rightNodes);

	// 为了处理单个正则表达式和多个正则表达式的差异，可能要判断如果有多个正则表达式，则在生成布局信息前先小技巧增加一个辅助节点在最后，让每个本来的接受状态都直接连接过去
	// 然后理解为一个对多个正则表达式的巨大的并操作，这样就可以最大程度的降低考虑两种情况的差异带来的实现麻烦
	// 

	function x() {
		// 匹配并操作的起点和终点
		// 从左到右扫描数据结构 stems
		//  遇到一个分点，
	}


	function countLines() {
		let num = 0;
	}


	function fork(branches) {
		let temp = _new_arr_with_v(2 * branches.length - 1, -1);
		branches.forEach((b, i) => temp[2 * (i + 1) - 2] = b)
		return temp;
	}

	var l = 0;
	var two_D_space = [];

	two_D_space;
	while (l < level) {

	}



	return graph;
}


// T_1 = ab|c|d
// T_2 = a(e|a)b(c|d|e|a)
// T_3 = a(b|c)
var transitionTable = [
	[[1, 11, 31], [], [], [], [], []],//0
	[[2, 6, 8], [], [], [], [], []],//1
	[[], [3], [], [], [], []],//2
	[[4], [], [], [], [], []],//3
	[[], [], [5], [], [], []],//4
	[[10], [], [], [], [], []],//5
	[[], [], [], [7], [], []],//6
	[[10], [], [], [], [], []],//7
	[[], [], [], [], [9], []],//8
	[[10], [], [], [], [], []],//9
	[[], [], [], [], [], []],//10
	[[], [12], [], [], [], []],//11
	[[13], [], [], [], [], []],//12
	[[14, 16], [], [], [], [], []],//13
	[[], [], [], [], [], [15]],//14
	[[18], [], [], [], [], []],//15
	[[], [17], [], [], [], []],//16
	[[18], [], [], [], [], []],//17
	[[19], [], [], [], [], []],//18
	[[], [], [20], [], [], []],//19
	[[21], [], [], [], [], []],//20
	[[22, 24, 26, 28], [], [], [], [], []],//21
	[[], [], [], [23], [], []],//22
	[[30], [], [], [], [], []],//23
	[[], [], [], [], [25], []],//24
	[[30], [], [], [], [], []],//25
	[[], [], [], [], [], [27]],//26
	[[30], [], [], [], [], []],//27
	[[], [29], [], [], [], []],//28
	[[30], [], [], [], [], []],//29
	[[], [], [], [], [], []],//30
	[[], [32], [], [], [], []],//31
	[[33], [], [], [], [], []],//32
	[[34, 36], [], [], [], [], []],//33
	[[], [], [35], [], [], []],//34
	[[38], [], [], [], [], []],//35
	[[], [], [], [37], [], []],//36
	[[38], [], [], [], [], []],//37
	[[], [], [], [], [], []]//38
];
var alphabet = ['ε', 'a', 'b', 'c', 'd', 'e'];



var graph = Layout(transitionTable, alphabet)



var graph = Layout(transitionTable, alphabet)



// [],[13],[]
// [],[13],[]
// [],[13],[]
// [14],[],[16]
// [
// 	[[],[],[],[],[],[],[0],[],[]],//0
// 	[[],[],[1],[],[],[],[11],[],[31]],//1
// 	[[2],[],[6],[],[8],[],[12],[],[32]],//2
// 	[[3],[],[7],[],[9],[],[13],[],[33]],//3
// 	[[4],[],[],[],[],[],[*],[],[]],//4
// 	[[],[],[],[],[],[],[],[],[]],//5
// 	[[],[],[],[],[],[],[],[],[]],//6
// 	[[],[],[],[],[],[],[],[],[]],//7
// 	[[],[],[],[],[],[],[],[],[]],//8
// 	[[],[],[],[],[],[],[],[],[]],//9
// 	[[],[],[],[],[],[],[],[],[]],//10
// 	[[],[],[],[],[],[],[],[],[]],//11
// 	[[],[],[],[],[],[],[],[],[]],//12
// ]
21  22 24 26 28

22, -1, 24, -1, 26, -1, 28
	- 1, -1, -1, -1, -1, -1, -1

	[
	[-1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1],//0
	[-1, -1, 1, -1, -1, -1, -1, 11, -1, -1, -1, 31, -1],//1
	[2, -1, 6, -1, 8, -1, -1, 12, -1, -1, -1, 32, -1],//2
	[3, -1, 7, -1, 9, -1, -1, 13, -1, -1, -1, 33, -1],//3
	[4, -1, -1, -1, -1, -1, 14, -1, 16, -1, 34, -1, 36],//4
	[5, -1, -1, -1, -1, -1, 15, -1, 17, -1, 35, -1, 37],//5
	[-1, -1, 10, -1, -1, -1, -1, 18, -1, -1, -1, 38, -1],//6
	[-1, -1, -1, -1, -1, -1, -1, 19, -1, -1, -1, -1, -1],//7
	[-1, -1, -1, -1, -1, -1, -1, 20, -1, -1, -1, -1, -1],//8
	[-1, -1, -1, -1, -1, -1, -1, 21, -1, -1, -1, -1, -1],//9
	[-1, -1, -1, -1, -1, -1, -1, 21, -1, -1, -1, -1, -1],//10


]

	[
	[-1, -1, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1],//0
	[-1, -1, 1, -1, -1, -1, -1, -1, -1, 11, -1, -1, -1, -1, -1, 31, -1],//1
	[2, -1, 6, -1, 8, -1, -1, -1, -1, -1, 12, -1, -1, -1, -1, 32, -1],//2
	[3, -1, 7, -1, 9, -1, -1, -1, -1, -1, 13, -1, -1, -1, -1, 33, -1],//3
	[4, -1, -1, -1, -1, -1, -1, -1, 14, -1, 16, -1, -1, -1, 34, -1, 36],//4
	[5, -1, -1, -1, -1, -1, -1, -1, 15, -1, 17, -1, -1, -1, 35, -1, 37],//5
	[-1, -1, 10, -1, -1, -1, -1, -1, -1, 18, -1, -1, -1, -1, -1, 38, -1],//6
	[-1, -1, -1, -1, -1, -1, -1, -1, -1, 19, -1, -1, -1, -1, -1, -1, -1],//7
	[-1, -1, -1, -1, -1, -1, -1, -1, -1, 20, -1, -1, -1, -1, -1, -1, -1],//8
	[-1, -1, -1, -1, -1, -1, -1, -1, -1, 21, -1, -1, -1, -1, -1, -1, -1],//9
	[-1, -1, -1, -1, -1, -1, 22, -1, 24, -1, 26, -1, 28, -1, -1, -1, -1],//10


]

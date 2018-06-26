
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
	function _indexOf(array, value) {
		let indexes = [];
		array.forEach((e, i) => {
			if (value === e) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}
	// var nodes = _range(transitionTable.length);
	var stems = _new_arr_with_v(transitionTable.length, -1);
	var levels = _new_arr_with_v(transitionTable.length, -1);

	var level = 0;
	stems[0] = 0;
	levels[0] = 0;

	while (true) {
		let isDone = true;

		for (let node of _indexOf(levles, levle)) {
			let nextNodes = nodesInfo.get(node).nextNodes;
			for (let nextNode of nextNodes) {
				if (levles[nextNode] === -1) {
					// 第一次遇到 node
					stems[nextNode] = [node];
					levels[nextNode] = levels[node] + 1;
				} else {
					// nextNode 已经在某个 level 中
					if (stems[nextNode].indexOf(node) != -1) {
						// 之前 nextNode 的前置设置正确， 不用做更改
					} else if (isStemOf(node, nextNode)) {
						// 返回边，不理
					} else {
						let trace_existone = traceback(nextNode);
						let trace_newone = traceback(node);
						trace_newone.push(nextNode);
						///
						if (stems[nextNode].length > 1) {
							// 似乎可以肯定 nextNode 是一个并点
						} else
							if (isCover(trace_newone, trace_existone)) {
								// nextNode 存在，但是之前设置的 stem 是错的，正解为 node
								stems[nextNode] = node;
								// 把所有受影响的 node 的 levels 改正确
								// 注意后面的节点的排序目前认为是正确的，故只需要遍历一下改正 level 就 ok 
								let i = nextNode;
								while (i != -1) {
									//levels[i] = levels[stems[i]] + 1;
									//i = stems.indexOf(i);
								}
							} else {
								// nextNode 存在，
							}
					}
				}
			}
		}

		level++;
		if (isDone) break;
	}



	console.log(nodes, stems, levels);

	return;
}



// (a*b)*c
var transitionTable = [
	[[1, 7], [], [], []],//0
	[[2, 4], [], [], []],//1
	[[], [3], [], []],//2
	[[2, 4], [], [], []],//3
	[[5], [], [], []],//4
	[[], [], [6], []],//5
	[[1, 7], [], [], []],//6
	[[8], [], [], []],//7
	[[], [], [], [9]],//8
	[[], [], [], []]//9
];
var alphabet = ['ε', 'a', 'b', 'c'];


var graph = Layout(transitionTable, alphabet)
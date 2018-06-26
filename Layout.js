
function Layout(TB, A) {
	let _range = length => Array.from({ length }).map((v, k) => k);
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

	var nodes = [];
	var stems = [];
	var levels = [];
	var graph = [];
	// 辅助数据结构，每次在合并两个分支时，之前只是记录了两个分支是从哪里分出来的
	// 有一种情况，就是实际上两个分支有一个（甚至两个）是走过“捷径”的但是还没被搜索发现
	// 于是打补丁：每次合并都记录合并了哪两个分支最后一个节点
	// 当发现其中一个节点走了捷径，就把合并后的节点的前面一个标记为另外一个节点（而不是共同的stem）
	// 如果另外一个节点后续被发现也是走捷径，情况就是普通的去除捷径
	var mergeFlag = new Map();

	function addNode(node, preNode, level) {
		/**
		 * @param {*} node 待添加的 node 的 id
		 * @param {*} preNode 待添加的 node 的前一个 node 的 id
		 * @param {*} level 待添加的 node 在 graph 中的第几层
		 */
		nodes.push(node);
		stems.push(preNode);
		levels.push(level);
		graph[graph.length - 1].push(node);
	}

	function isStemFrom(node1, node2) {
		// 判断 node1 是否从 node2 长出来， 即在遍历图的路上，先经过了 node2 之后再遇到 node2
		// 由于重复匹配的情况下，可能回从 node1 又回去 node2，此时应该认为 node2 还是再 node1 前面
		trace_node1 = traceback(node1);
		if (trace_node1.indexOf(node2) === -1) return false;
		else return true;
	}

	function traceback(node) {
		//  从 0 到达 node 走过的轨迹
		let trace = [node];
		let preNode = stems[nodes.indexOf(node)];
		trace.unshift(preNode);
		while (preNode != 0) {
			preNode = stems[nodes.indexOf(preNode)];
			trace.unshift(preNode);
		}
		// trace.unshift(0);
		return trace;
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

	function findLastCommonStem(trace_newone, trace_existone) {
		// 对应两条不互相覆盖的路径，找到两条路径从哪个节点开始分道扬镳
		let commonStem = 0;
		let i = 0;
		for (let node of trace_existone) {
			if (trace_newone[i] === node) {
				commonStem = node;
				i++;
			} else break;
		}
		return commonStem;
	}

	function cutStemOf(node) {
		// 斩掉从 node 长出来的后续节点， 包括 node 本身
		// 把 ndoes， stems， levels 中记录的关于所有要被移除的 node 的信息删除， 同时将所有这些 node 从 graph 中移除
		let nodes_to_cut = [node];
		while (true) {
			let indexes = _indexOf(stems, node);
			if (indexes != -1) {
				indexes.forEach(e => {
					node = nodes[e];
					nodes_to_cut.push(node);
				})
			} else break;

		}
		nodes_to_cut.forEach(n => {
			let i = nodes.indexOf(n);
			// mergeFlag.delete(n);//不能删。。。。刚刚加进来就删。。。
			graph[levels[i]].splice(graph[levels[i]].indexOf(n), 1);
			nodes.splice(i, 1);
			stems.splice(i, 1);
			levels.splice(i, 1);
		})
		return nodes_to_cut;
	}

	function _indexOf(array, value) {
		let indexes = [];
		array.forEach((e, i) => {
			if (value === e) indexes.push(i);
		});
		if (indexes.length === 0) return -1;
		else return indexes;
	}

	graph[0] = [];
	addNode(0, 0, 0);

	while (true) {
		let isDone = true;
		let preLevelNodes = graph[graph.length - 1].slice();
		graph[graph.length] = [];
		for (let preNode of preLevelNodes) {
			var nextNodes = nodesInfo.get(preNode).nextNodes;
			// if (nextNodes === []) break;
			for (let n of nextNodes) {
				isDone = false;
				if (nodes.indexOf(n) === -1) {
					addNode(n, preNode, graph.length - 1);
				} else if (isStemFrom(preNode, n)) {
					// do nothing
				} else {

					let trace_existone = traceback(n);
					let trace_newone = traceback(preNode);
					trace_newone.push(n);
					if (isTraceCover(trace_newone, trace_existone)) {
						// trace_existone 走了捷径： 去掉捷径，同时所有后续的走了该捷径的节点全部去掉
						// 如果 trace_existone 中最后一个点是 mergeFlag 中标记的点的两个合并点之一，
						// 应该把合并点的 stem 从之前的共同 stem 改为另外一个节点（可以理解为之前合并的时候本来是“公平的”，后续发现了一个点走过捷径，之前的就是误判了，补救就是“取消”之前的合并）
						for (let [mergePoint, branch] of mergeFlag) {
							if (branch.node1 === n) {
								stems[nodes.indexOf(mergePoint)] = branch.node2;
								mergeFlag.delete(mergePoint);
								break;
							} else if (branch.node2 === n) {
								stems[nodes.indexOf(mergePoint)] = branch.node1;
								mergeFlag.delete(mergePoint);
								break;
							}
						}
						let node_cutted = cutStemOf(n);
						for (let n of node_cutted) {
							if (preLevelNodes.indexOf(n) != -1) {
								preLevelNodes.splice(preLevelNodes.indexOf(n), 1);
							}
						}
						addNode(n, preNode, graph.length - 1);
					} else {
						// 分支合并， 设置合并后的节点的 stem 为合并的两条分支的共同 stem
						// 同时标记 mergeFlag 中合并后的节点是在哪两个点合并的
						mergeFlag.set(n, { 
							node1: trace_existone[trace_existone.length - 2], 
							node2: trace_newone[trace_newone.length - 2] 
						})	;
						let commonStem = findLastCommonStem(trace_newone, trace_existone);
						let node_cutted = cutStemOf(n);
						// 这个不知道有没有必要
						for (let n of node_cutted) {
							if (preLevelNodes.indexOf(n) != -1) {
								preLevelNodes.splice(preLevelNodes.indexOf(n), 1);
							}
						}
						addNode(n, commonStem, graph.length - 1);
					}
				}
			}
		}
		if (isDone) break;
	}
	graph.pop();
	console.log(nodes, stems, levels);
	console.log(graph);
	return graph;
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
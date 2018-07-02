function DFALayout(TB, A) {
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
        let trace_node1 = traceback(node1);
        if (trace_node1.indexOf(node2) === -1) return false;
        else return true;
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
                } else if (nextNode === node) {
                    // DFA 中所有“往前”走的边都应该保留，捷径也应该保留
                    // 去掉的边是：往回走的边，和自己到自己的边
                    // 参考课本 P99 的 图3-36 中，可以看到所有“往前”走的边都是直线的
                    // 如：A-C, A-B-C, A-B-D-E-C
                    // 所有在这里认为是直线的边只需要在画图的时候多加一步对于同level的边的判断就行了
                    // 就是说如果同level的直线边如果跨过了一个点就把这条边变弯就行了。 
                    // 这里导致的一个和 NFA 水平排序的巨大不同就是：所有 node 的 level 在第一次设定之后就不会修改了


                    // 把自己到自己的边去掉
                    transitionTable[node].forEach(arr => {
                        if (arr.indexOf(node) != -1) arr.pop();
                    })
                } else if (isStemOf(node, nextNode)) {
                    // 返回边不理
                    // 从 transitionTable 中去掉这条 [返回边]: node 的 “下一个” 点的集合 中有一个是在 node 前面，从 node 到 这个点的边就是 [返回边]
                    transitionTable[node].forEach(arr => {
                        if (arr.indexOf(nextNode) != -1) arr.pop();
                    })
                }
            }
        }
    }

    var graph = [];
    var l = 0;
    while (l < level) graph.push(_indexsOf(levels, l++));

    let nodesLevelInfo = new Map();
    graph.forEach((arr, level) => arr.forEach(node => nodesLevelInfo.set(node, level + 1)));

    return [transitionTable, nodesLevelInfo];
}


// (a|b)*abb
var transitionTable = [
    [[1], [2]],//0
    [[1], [3]],//1
    [[1], [2]],//2
    [[1], [4]],//3
    [[1], [2]]//4
];
var alphabet = ['a', 'b'];

var t = DFALayout(transitionTable, alphabet);


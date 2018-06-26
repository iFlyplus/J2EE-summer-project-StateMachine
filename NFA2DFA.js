/**
 * 
 * @param {*} alphabet 
 * @param {*} transitionTable 
 * @param {*} acceptState2patternId 
 * @description 根据中文课本 P96 - P98 的自己构造法实现
 * 				初始化的数据格是定义NFA的三张表，格式是给前段的数据格式
 * 				CAUTION  1. 目前没考虑优先级，如果用户的定义存在冲突可能会在合并状态是丢弃信息
 * 						 2. 默认字符表里面有 ε
 * @interface generateDFA 将初始化 NFA2DFA 时候传入的 NFA 定义用子集构造法转化成 DFA
 * 						返回数据格式是
 */
function NFA2DFA(alphabet, transitionTable, acceptState2patternId) {
	let _range = length => Array.from({ length }).map((v, k) => k);
	var alphabet = alphabet;
	var transitionTable = transitionTable;
	var acceptState2patternId = acceptState2patternId;
	var NFAStates = _range(transitionTable.length);

	/**
	 * @description 辅助函数，计算一个 state 的 ε-closure
	 * @param {*} state 
	 * @return 一个array
	 */
	function compute_closure(state) {
		if (typeof state === 'number') state = [state];
		let state_closure = new Set(state);
		let sizeBefore = state_closure.size;
		for (let s of state_closure) {
			for (let ss of transitionTable[s][alphabet.indexOf('ε')]) {
				state_closure.add(ss);
			}
		}
		if (state_closure.size === sizeBefore) {
			return [...state_closure];
		} else {
			return compute_closure([...state_closure]);
		}
	}
	// 计算 NFA 所有状态的闭包，保存在closureTable
	var closureTable = new Map();
	for (let state of NFAStates) closureTable.set(state, compute_closure(state));

	// DFA 的每个状态是 一个NFA状态的集合，跑子集构造算法来得到这些状态集合，存放在 DFA_states
	// 子集构造算法构造的转换表放在 DFA_transition，格式 [from_state, character, to_state]
	var DFA_states = [];
	var DFA_transition = [];
	var accepted2REid = [];

	return {
		generateDFA: function () {
			let Dstates_tag = [];
			// 初始化 DFA 的开始状态为 NFA 开始状态的 ε-闭包，标记为 false
			DFA_states.push(closureTable.get(0));
			Dstates_tag.push(false);
			if (this.whichREId(DFA_states[0]) != -1) accepted2REid.push({ state: 0, REId: this.whichREId(DFA_states[0]) });
			while (Dstates_tag.indexOf(false) != -1) {
				let index_T = Dstates_tag.indexOf(false);
				let T = DFA_states[index_T];
				Dstates_tag[index_T] = true;
				for (let char of alphabet) {
					if (char === 'ε') continue;
					let U = this.closure_of_set(this.move(T, char));
					if (U.length === 0) continue;

					if (this.indexOf(DFA_states, U) === -1) {
						DFA_states.push(U.slice());
						Dstates_tag.push(false);
						if (this.whichREId(U) != -1) accepted2REid.push({ state: this.indexOf(DFA_states, U), REId: this.whichREId(U) });
					}
					DFA_transition.push({
						StartState: index_T,
						inputChar: char,
						endState: this.indexOf(DFA_states, U)
					});
				}
			}
			return {
				stateTransition: DFA_transition,
				alphabet: alphabet.join("").replace("ε","").split(''),
				acceptStateList: accepted2REid
			};
		},
		getFormalDFA:function(){
			let table = new Array();
			let alphaB = alphabet.join("").replace("ε","").split('');
			for (let row of _range(DFA_states.length)){
				table.push(new Array());
				for(let col of _range(alphaB.length)){
					table[table.length-1].push(new Array());
					table[table.length-1][table[table.length-1].length-1].push(new Array());
				}
			}
			for(let tran of DFA_transition){
				table[tran.StartState][alphaB.indexOf(tran.inputChar)][0].push(tran.endState);
			}
			return {
				alphabet:alphaB,
				transitionTable:table,
				acceptState2patternId:accepted2REid
			}
		},
		whichREId: function (states) {
			/**
			 * @description 如果该集合是接受态，返回该集合对于的正则表达式 id， 否则返回 -1
			 * 注： 包含 NFA 的接受状态的状态集合对应的 DFA 状态为 DFA 的接受状态
			 * CAUTION： 目前默认一个接受态只对应一个模式，没有考虑优先级
			 */
			for (let obj of acceptState2patternId) {
				if (states.indexOf(obj.state) != -1) {
					return obj.REId;
				}
			}
			return -1;
		},
		move: function (T, ch) {
			/**
			 * @param {*} T 
			 * @param {*} ch 
			 * @return 从状态集合 T 中的某个状态出发通过 label 为 a 的边能够到达的 NFA 状态集合
			 */
			let to_states = new Set();
			for (let s of T) transitionTable[s][alphabet.indexOf(ch)].forEach(ss => { to_states.add(ss) });
			return [...to_states];
		},
		closure_of_set: function (T) {
			/**
			 * @param {*} T 
			 * @return 从状态集合 T 中的某个状态出发只通过 ε-转换 能够到达的 NFA 状态集合
			 */
			let closure = new Set(T);
			for (let s of T) closureTable.get(s).forEach(e => { closure.add(e) });
			return [...closure];
		},
		indexOf: function (arrayOFarray, array) {
			/**
			 * @param {*} arrayOFarray 
			 * @param {*} array 
			 * @return arrayOFarray 中和 array 长得一模一样的元素的下标，若不存在则返回 -1
			 */
			if (arrayOFarray.length === 0) return -1;
			let index = -1;
			let i = 0;
			for (let arr of arrayOFarray) {
				if (arr.length === array.length) {
					let flag = true;
					for (let e of arr) {
						if (array.indexOf(e) === -1) {
							flag = false;
							break;
						}
					}
					if (flag === true) {
						index = i;
						break;
					}
				}
				i++;
			}
			return index;
		}
	} // end return
}


var alphabet = ['ε', 'a', 'b'];
var transitionTable = [
	[[1, 7], [], []],//0
	[[2, 4], [], []],//1
	[[], [3], []],//2
	[[6], [], []],//3
	[[], [], [5]],//4
	[[6], [], []],//5
	[[1, 7], [], []],//6
	[[], [8], []],//7
	[[], [], [9]],//8
	[[], [], [10]],//9
	[[], [], []]//10
];
var acceptState2patternId = [
	{
		state: 10,
		REId: 0
	}
];






var alphabet = ['ε', 'a', 'b'];
var transitionTable = [
	[[1, 7], [], []],//0
	[[2, 5], [], []],//1
	[[], [3], []],//2
	[[4], [], []],//3
	[[1, 7], [], []],//4
	[[], [], [6]],//5
	[[4], [], []],//6
	[[], [], []]//7
];
var acceptState2patternId = [
	{
		state: 7,
		REId: 0
	}
];



var nfa2dfa = NFA2DFA(alphabet, transitionTable, acceptState2patternId)

nfa2dfa.generateDFA()


var nfa2dfa = NFA2DFA(testdata.NFA_cpp().alphabet, testdata.NFA_cpp().transitionTable, testdata.NFA_cpp().acceptState2patternId)
nfa2dfa.generateDFA();
nfa2dfa.getFormalDFA();


dfa_data = nfa2dfa.getFormalDFA();
alphabet = dfa_data.alphabet
transitionTable = dfa_data.transitionTable
acceptState2patternId = dfa_data.acceptState2patternId

var myDFA = create_DFA(transitionTable, alphabet, acceptState2patternId)
myDFA.feedText('for(int i = 0;i<100;i++){class a{};}');
myDFA.init();
myDFA.nextStep();
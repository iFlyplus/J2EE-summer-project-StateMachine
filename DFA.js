/**
 * 
 * @param {*} TB 
 * @param {*} A 
 * @param {*} state2pattern 一个数组，成员为（js对象）{state:接受态id ,REId:正则表达式id}
 */

var DFA_CODE = {
	INIT: 0,
	DONE: 1,
	NEXTSTEP: 2,
	ACCEPT: 3,
	REJECT: 4,
	UNKNOWN: 5,
	PRESTEP: 6,
	NOPRESTEP: 7
};

function create_DFA(TB, A, state2pattern) {
	let _range = length => Array.from({ length }).map((v, k) => k);
	var transitionTable = TB;
	var alphabet = A;
	var acceptState2patternId = new Map(state2pattern.map(obj => {
		return [obj.state, obj.REId];
	}));
	var DFAStates = _range(transitionTable.length);
	var DFAAcceptStates;
	var DFAStatesTransition = [];
	var text;

	// 计算 DFAAcceptStates
	DFAAcceptStates = state2pattern.map(obj => {
		return obj.state;
	})
	// 计算 DFAStatesTransition
	for (let f_state of _range(transitionTable.length)) {
		for (let ch_index of _range(alphabet.length)) {
			for (let t_state of transitionTable[f_state][ch_index]) {
				DFAStatesTransition.push({ id: DFAStatesTransition.length, from: f_state, to: t_state, arrows: 'to', label: alphabet[ch_index] });
			}
		}
	}

	/***************************************  状态机状态    */
	var scanStartIndex = -1;
	var scanEndIndex = -1;
	var currentState = 0;
	var acceptedState = null;
	var historials = [];
	var recognizedTokens = [];
	var currentTransition = null;
	/***************************************  状态机状态    */

	return {
		getDFAStates: function () {
			return DFAStates;
		},
		getDFAStatesTransition: function () {
			return DFAStatesTransition;
		},
		getDFAAcceptStates: function () {
			return DFAAcceptStates;
		},
		feedText: function (t) {
			text = t;
		},
		init: function () {
			scanStartIndex = -1;
			scanEndIndex = -1;
			currentState = 0;
			acceptedState = null;
			historials = [];
			recognizedTokens = [];
			currentTransition = null;

			return this.createResponse(DFA_CODE.INIT);
		},
		reset: function () {
			currentState = 0;
			currentTransition = null;
			acceptedState = null;
		},
		nextStep: function () {
			// 情况一：Token提取完成
			if (scanStartIndex === scanEndIndex && scanEndIndex === (text.length - 1)) {
				return this.createResponse(DFA_CODE.DONE);
			}

			// 情况二：遇到了DFA拒绝的输入
			if (currentState === -1 && acceptedState === null && alphabet.indexOf(text[scanEndIndex + 1]) != -1) {
				return this.createResponse(DFA_CODE.REJECT);
			}

			// 情况三：遇到了DFA遇到了不认识的字符
			if (currentState === -1 && acceptedState === null && alphabet.indexOf(text[scanEndIndex + 1]) === -1) {
				return this.createResponse(DFA_CODE.UNKNOWN);
			}

			// 前面三种情况不会改变状态机状态，后面的操作回改变状态机状态，先保存历史轨迹
			historials.push({
				scanStartIndex: scanStartIndex,
				scanEndIndex: scanEndIndex,
				currentState: currentState,
				acceptedState: acceptedState,
				recognizedTokens: recognizedTokens.slice(),
				currentTransition: currentTransition
			});

			// 情况四：提取Token
			if (currentState === -1 && acceptedState != null) {
				console.log(`accept: [${text.substring(scanStartIndex + 1, scanStartIndex + 1 + acceptedState.offset)}]`);
				recognizedTokens.push({
					startIndex: scanStartIndex + 1,
					endIndex: scanStartIndex + 1 + acceptedState.offset,
					REId: acceptState2patternId.get(acceptedState.stateId)
				});

				scanStartIndex += acceptedState.offset;
				scanEndIndex = scanStartIndex;

				this.reset();
				return this.createResponse(DFA_CODE.ACCEPT);
			}

			// 情况五：遵循最长子串原则继续读字符
			this.readChar();
			return this.createResponse(DFA_CODE.NEXTSTEP);
		},
		preStep: function () {
			if (historials.length === 0) {
				return this.createResponse(DFA_CODE.NOPRESTEP);
			}
			let lastState = historials.pop();
			scanStartIndex = lastState.scanStartIndex;
			scanEndIndex = lastState.scanEndIndex;
			currentState = lastState.currentState;
			acceptedState = lastState.acceptedState;
			recognizedTokens = lastState.recognizedTokens.slice();
			currentTransition = lastState.currentTransition;
			return this.createResponse(DFA_CODE.PRESTEP);
		},
		readChar: function () {

			let character = text[scanEndIndex + 1];
			let charIndex = alphabet.indexOf(character);
			let nextState = -1;

			// 到达文本结尾，没有下一个字符可读取，设置 currentState = -1
			if (scanEndIndex === text.length - 1) {
				console.log('end of text');
				console.log(`scan start: ${scanStartIndex}, scan end: ${scanEndIndex}: scan window: ${text.substring(scanStartIndex + 1, scanEndIndex + 1)}`);
				currentState = -1;
				currentTransition = null;
				return;
			}

			console.log(`scan start: ${scanStartIndex}, scan end: ${scanEndIndex}: scan window: ${text.substring(scanStartIndex + 1, scanEndIndex + 2)}`);
			console.log(`look at: #${scanEndIndex + 1} '${character}'`);

			// 遇到不认识的字符，设置 currentState = -1
			if (charIndex === -1) {
				console.log(`unknown char at: ${scanEndIndex + 1} '${character}'`);
				currentState = -1;
				currentTransition = null;
				return;
			}

			// 查找下一个状态，注意接口定义中，不管是 NFA 还是 DFA 后端给前端的 transitionTable 的每一个项都是一个array
			nextState = transitionTable[currentState][charIndex];

			// 更新NFA状态
			// 对于 DFA 来说遇到一个字符能跳转去的状态是唯一的，所以只要看 transitionTable[f_state][charIndex] 是不是空
			// 空就是没有下一个状态，设置 currentState = -1
			// 不为空就肯定只有一个元素。
			if (nextState.length === 0) {
				currentState = -1;
				currentTransition = null;
			} else {
				currentTransition = this._getEdgeId(currentState, nextState[0]);
				currentState = nextState[0];
				if (DFAAcceptStates.indexOf(currentState) != -1) {
					acceptedState = { stateId: currentState, offset: (scanEndIndex + 1) - scanStartIndex }
				}
			}
			scanEndIndex++;
		},
		createResponse: function (code) {
			let resp;
			switch (code) {
				case DFA_CODE.INIT:
					resp = {
						code: DFA_CODE.INIT,
						graphInfo: {
							highlightNodes: [currentState],
							highlightEdges: []
						},
						windowInfo: {
							recognizedTokens: recognizedTokens,
							scanning: {
								startIndex: scanStartIndex + 1,
								endIndex: scanEndIndex + 1
							},
							remains: {
								startIndex: scanEndIndex + 1,
								endIndex: text.length
							}
						}
					}
					break;
				case DFA_CODE.DONE:
					resp = {
						code: DFA_CODE.DONE,
						graphInfo: {

						},
						windowInfo: {

						}
					};
					break;

				case DFA_CODE.NEXTSTEP:
					resp = {
						code: DFA_CODE.NEXTSTEP,
						graphInfo: {
							highlightNodes: (currentState === -1) ? [] : [currentState],
							highlightEdges: (currentTransition === null) ? [] : [currentTransition]
						},
						windowInfo: {
							recognizedTokens: recognizedTokens,
							scanning: {
								startIndex: scanStartIndex + 1,
								endIndex: scanEndIndex + 1
							},
							remains: {
								startIndex: scanEndIndex + 1,
								endIndex: text.length
							}
						}
					};
					break;
				case DFA_CODE.ACCEPT:
					resp = {
						code: DFA_CODE.ACCEPT,
						graphInfo: {
							highlightNodes: [currentState],
							highlightEdges: []
						},
						windowInfo: {
							recognizedTokens: recognizedTokens,
							scanning: {
								startIndex: scanStartIndex + 1,
								endIndex: scanEndIndex + 1
							},
							remains: {
								startIndex: scanEndIndex + 1,
								endIndex: text.length
							}
						}
					};
					break;
				case DFA_CODE.REJECT:
					resp = {
						code: DFA_CODE.REJECT,
						from: scanStartIndex + 1,
						graphInfo: {

						},
						windowInfo: {

						}
					}
					break;
				case DFA_CODE.UNKNOWN:
					resp = {
						code: DFA_CODE.UNKNOWN,
						at: scanEndIndex + 1,
						unknownChar: text[scanEndIndex + 1],
						graphInfo: {

						},
						windowInfo: {

						}
					}
					break;
				case DFA_CODE.NOPRESTEP:
					resp = {
						code: DFA_CODE.NOPRESTEP,
						graphInfo: {
							highlightNodes: [currentState],
							highlightEdges: []
						},
						windowInfo: {
							recognizedTokens: recognizedTokens,
							scanning: {
								startIndex: scanStartIndex + 1,
								endIndex: scanEndIndex + 1
							},
							remains: {
								startIndex: scanEndIndex + 1,
								endIndex: text.length
							}
						}
					};
					break;
				case DFA_CODE.PRESTEP:
					resp = {
						code: DFA_CODE.PRESTEP,
						graphInfo: {
							highlightNodes: (currentState === -1) ? [] : [currentState],
							highlightEdges: (currentTransition === null) ? [] : [currentTransition]
						},
						windowInfo: {
							recognizedTokens: recognizedTokens,
							scanning: {
								startIndex: scanStartIndex + 1,
								endIndex: scanEndIndex + 1
							},
							remains: {
								startIndex: scanEndIndex + 1,
								endIndex: text.length
							}
						}
					};
					break;
				default:
					break;
			}
			return resp;
		},
		_getEdgeId: function (from, to) {
			var edgeId;
			for (var e of DFAStatesTransition) {
				if (e.from === from && e.to === to) {
					edgeId = e.id;
					break;
				}
			}
			return edgeId;
		}

	}; // end return

};
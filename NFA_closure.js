/**
 * 
 * @param {*} TB 
 * @param {*} A 
 * @param {*} state2pattern 一个数组，成员为（js对象）{state:接受态id ,REId:正则表达式id}
 */

var NFA_CODE = {
  INIT: 0,
  DONE: 1,
  DOCLOSURE: 2,
  READCHAR: 3,
  ACCEPT: 4,
  REJECT: 5,
  UNKNOWN: 6,
  PRESTEP: 7,
  NOPRESTEP: 8
};

function create_NFA(TB, A, state2pattern) {
  let _range = length => Array.from({ length }).map((v, k) => k);
  var transitionTable = TB;
  var alphabet = A;
  var acceptState2patternId = new Map(state2pattern.map(obj => {
    return [obj.state, obj.REId];
  }));
  var NFAStates = _range(transitionTable.length);
  var NFAAcceptStates;
  var NFAStatesTransition = [];
  var closureTable = new Map();
  var closureTable_with_edges = new Map();
  var text;

  // 计算 NFAAcceptStates
  NFAAcceptStates = state2pattern.map(obj => {
    return obj.state;
  })
  // 计算 NFAStatesTransition
  for (let f_state of _range(transitionTable.length)) {
    for (let ch_index of _range(alphabet.length)) {
      for (let t_state of transitionTable[f_state][ch_index]) {
        NFAStatesTransition.push({ id: NFAStatesTransition.length, from: f_state, to: t_state, arrows: 'to', label: alphabet[ch_index] });
      }
    }
  }

  /**
   * @description 辅助函数，根据当前状态 from 和迁移到的状态 to 找到对应的 edge 的 id
   * @param {*} from 
   * @param {*} to
   * @return  对应的边的 id
   */
  function getEdgeId(from, to, char) {
    let edgeId;
    for (let e of NFAStatesTransition) {
      if (e.from === from && e.to === to && e.label === char) {
        edgeId = e.id;
        break;
      }
    }
    return edgeId;
  }

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
  for (let state of NFAStates) {
    // closureTable.set(state, compute_closure(state));
  }

  /**
   * @description 辅助函数，计算一个 state 的 ε-closure， 以及做闭包过程中走过的 ε 迁移边的 id
   * @param {*} state 
   * @return 一个对象，{states：闭包的状态集， edges：做闭包过程中走过的 ε 迁移边的 id}
   */
  function compute_closure_with_edges(state) {
    if (typeof state === 'number') state = { states: [state], edges: [] };
    let edges = new Set(state.edges);
    let state_closure = new Set(state.states);
    let sizeBefore = state_closure.size;
    for (let s of state_closure) {
      for (let ss of transitionTable[s][alphabet.indexOf('ε')]) {
        state_closure.add(ss);
        edges.add(getEdgeId(s, ss, 'ε'));
      }
    }
    if (state_closure.size === sizeBefore) {
      return { states: [...state_closure], edges: [...edges] };
    } else {
      return compute_closure_with_edges({ states: [...state_closure], edges: [...edges] });
    }
  }

  for (let state of NFAStates) {
    closureTable_with_edges.set(state, compute_closure_with_edges(state));
  }

  /***************************************  状态机状态    */
  var scanStartIndex = -1;
  var scanEndIndex = -1;
  var currentStates = [];
  var acceptedStates = [];
  var TODOClosure = true;
  var historials = [];
  var recognizedTokens = [];
  var currentTransitions = [];
  /***************************************  状态机状态    */

  return {
    getNFAStates: function () {
      return NFAStates;
    },
    getNFAStatesTransition: function () {
      return NFAStatesTransition;
    },
    getNFAAcceptStates: function () {
      return NFAAcceptStates;
    },
    feedText: function (t) {
      text = t;
    },
    init: function () {
      scanStartIndex = -1;
      scanEndIndex = -1;
      currentStates = [];
      acceptedStates = [];
      TODOClosure = true;
      historials = [];
      recognizedTokens = [];
      currentTransitions = [];

      currentStates.push(0);
      return this.createResponse(NFA_CODE.INIT);
    },
    reset: function () {
      currentStates = [];
      acceptedStates = [];
      currentStates.push(0);
      // 接受一个token后下一步是做闭包还是读字符
      TODOClosure = true;
      currentTransitions = [];
    },
    nextStep: function () {
      // 情况一：Token提取完成
      if (scanStartIndex === scanEndIndex && scanEndIndex === (text.length - 1)) {
        // console.log('Done.');
        return this.createResponse(NFA_CODE.DONE);
      }

      // 情况二：遇到了NFA拒绝的输入
      if (currentStates.length === 0 && acceptedStates.length === 0 && alphabet.indexOf(text[scanEndIndex + 1]) != -1) {
        // console.log(`fail to recognize from: ${scanStartIndex+1}`);
        return this.createResponse(NFA_CODE.REJECT);
      }

      // 情况三：遇到了NFA遇到了不认识的字符
      if (currentStates.length === 0 && acceptedStates.length === 0 && alphabet.indexOf(text[scanEndIndex + 1]) === -1) {
        // console.log(`unknown char at: ${scanEndIndex+1} '${text[scanEndIndex+1]}'`);
        return this.createResponse(NFA_CODE.UNKNOWN);
      }

      // 前面三种情况不会改变状态机状态，后面的操作回改变状态机状态，先保存历史轨迹
      historials.push({
        TODOClosure: TODOClosure,
        scanStartIndex: scanStartIndex,
        scanEndIndex: scanEndIndex,
        currentStates: currentStates.slice(),
        acceptedStates: acceptedStates.slice(),
        recognizedTokens: recognizedTokens.slice(),
        currentTransitions: currentTransitions.slice()
      });

      // 情况四：提取Token
      // ps: 这里取 acceptedStates[0] 是因为暂时没考虑优先级
      // 如果后期考虑的话就要取 acceptedStates 里面 REId 最大的或者最小的 （一般是取最小）
      if (currentStates.length === 0 && acceptedStates.length != 0) {
        console.log(`accept: [${text.substring(scanStartIndex + 1, scanStartIndex + 1 + acceptedStates[0].offset)}]`);
        recognizedTokens.push({
          startIndex: scanStartIndex + 1,
          endIndex: scanStartIndex + 1 + acceptedStates[0].offset,
          REId: acceptState2patternId.get(acceptedStates[0].stateId)
        });

        scanStartIndex += acceptedStates[0].offset;
        scanEndIndex = scanStartIndex;

        this.reset();
        return this.createResponse(NFA_CODE.ACCEPT);
      }

      // 情况五：遵循最长子串原则继续重复做闭包和读字符
      if (TODOClosure) {
        this.doClosure();
        TODOClosure = false;
        return this.createResponse(NFA_CODE.DOCLOSURE);
      } else {
        this.readChar();
        TODOClosure = true;
        return this.createResponse(NFA_CODE.READCHAR);
      }

    },
    preStep: function () {
      if (historials.length === 0) {
        return this.createResponse(NFA_CODE.NOPRESTEP);
      }
      let lastState = historials.pop();
      TODOClosure = lastState.TODOClosure;
      scanStartIndex = lastState.scanStartIndex;
      scanEndIndex = lastState.scanEndIndex;
      currentStates = lastState.currentStates.slice();
      acceptedStates = lastState.acceptedStates.slice();
      recognizedTokens = lastState.recognizedTokens.slice();
      currentTransitions = lastState.currentTransitions.slice();
      return this.createResponse(NFA_CODE.PRESTEP);
    },
    doClosure: function () {
      console.log('do closure');

      let nextStates = new Set(currentStates);
      let nextAcceptedStates = new Set();
      let nextTransitions = new Set();
      let isAcceptedStatesUpdate = false;
      for (let f_state of currentStates) {
        let state_closure_with_edges = closureTable_with_edges.get(f_state);

        state_closure_with_edges.edges.forEach(e => {
          nextTransitions.add(e);
        });

        state_closure_with_edges.states.forEach(t_state => {
          nextStates.add(t_state);

          if (NFAAcceptStates.indexOf(t_state) != -1) {
            isAcceptedStatesUpdate = true;
            nextAcceptedStates.add({ stateId: t_state, offset: scanEndIndex - scanStartIndex })
          }
        });
      }
      currentStates = [...nextStates];
      currentTransitions = [...nextTransitions];
      if (isAcceptedStatesUpdate === true) acceptedStates = [...nextAcceptedStates];
    },
    readChar: function () {

      let character = text[scanEndIndex + 1];
      let charIndex = alphabet.indexOf(character);
      let nextStates = [];
      let nextTransitions = [];

      // 到达文本结尾，没有下一个字符可读取，设置 currentStates 为空
      if (scanEndIndex === text.length - 1) {
        console.log('end of text');
        console.log(`scan start: ${scanStartIndex}, scan end: ${scanEndIndex}: scan window: ${text.substring(scanStartIndex + 1, scanEndIndex + 1)}`);
        currentStates = [];
        currentTransitions = [];
        return;
      }

      console.log(`scan start: ${scanStartIndex}, scan end: ${scanEndIndex}: scan window: ${text.substring(scanStartIndex + 1, scanEndIndex + 2)}`);
      console.log(`look at: #${scanEndIndex + 1} '${character}'`);

      // 遇到不认识的字符，设置 currentState 为空
      if (charIndex === -1) {
        console.log(`unknown char at: ${scanEndIndex + 1} '${character}'`);
        currentStates = [];
        currentTransitions = [];
        return;
      }

      // 查找下一步的状态
      for (let f_state of currentStates) {
        let states = transitionTable[f_state][charIndex];
        for (let t_state of states) {
          nextStates.push(t_state);
          nextTransitions.push(this._getEdgeId(f_state, t_state, character));
        }
      }

      // 更新NFA状态
      currentStates = nextStates.slice();
      currentTransitions = nextTransitions.slice();
      scanEndIndex++;
    },
    _getEdgeId: function (from, to, char) {
      var edgeId;
      for (var e of NFAStatesTransition) {
        if (e.from === from && e.to === to && e.label === char) {
          edgeId = e.id;
          break;
        }
      }
      return edgeId;
    },
    createResponse: function (code) {
      let resp;
      switch (code) {
        case NFA_CODE.INIT:
          resp = {
            code: NFA_CODE.INIT,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        case NFA_CODE.DONE:
          resp = {
            code: NFA_CODE.DONE,
            graphInfo: {

            },
            windowInfo: {

            }
          };
          break;
        case NFA_CODE.DOCLOSURE:
          resp = {
            code: NFA_CODE.DOCLOSURE,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        case NFA_CODE.READCHAR:
          resp = {
            code: NFA_CODE.READCHAR,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        case NFA_CODE.ACCEPT:
          resp = {
            code: NFA_CODE.ACCEPT,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        case NFA_CODE.REJECT:
          resp = {
            code: NFA_CODE.REJECT,
            from: scanStartIndex + 1,
            graphInfo: {

            },
            windowInfo: {

            }
          }
          break;
        case NFA_CODE.UNKNOWN:
          resp = {
            code: NFA_CODE.UNKNOWN,
            at: scanEndIndex + 1,
            unknownChar: text[scanEndIndex + 1],
            graphInfo: {

            },
            windowInfo: {

            }
          }
          break;
        case NFA_CODE.NOPRESTEP:
          resp = {
            code: NFA_CODE.NOPRESTEP,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        case NFA_CODE.PRESTEP:
          resp = {
            code: NFA_CODE.PRESTEP,
            graphInfo: {
              highlightNodes: currentStates.slice(),
              highlightEdges: currentTransitions.slice()
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
        default:
          break;
      }
      return resp;
    }


  }// end return
}
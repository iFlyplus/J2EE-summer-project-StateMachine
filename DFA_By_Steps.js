function DFA_By_Steps() {

}


var DFA_Construstion_Process = [
	{
		REId:0,
		Steps:[
			[{//step1
				pattern: 'a',
				alphabet: ['ε','a'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			}],
			[{//step2
				pattern: 'a',
				alphabet: ['ε','a'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			},{
				pattern: 'b',
				alphabet: ['ε','b'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			}],
			[{//step3
				pattern: 'a',
				alphabet: ['ε','a'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			},{
				pattern: 'b',
				alphabet: ['ε','b'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			},{
				pattern: 'c',
				alphabet: ['ε','c'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			}],
			[{//step4
				pattern: 'a',
				alphabet: ['ε','a'],
				transitionTable: [
					[[],[1]],
					[[],[]]
				]
			},{
				pattern:'b|c',
				alphabet: ['ε','b','c'],
				transitionTable: [
					[[1,3],[],[]],//0
					[[],[2],[]],//1
					[[5],[],[]],//2
					[[],[],[4]],//3
					[[5],[],[]],//4
					[[],[],[]]//5
				]
			}],
			[],//step5
			[]//step6
		]
	}
];


var a={
	pattern:'(b|c)*',
	alphabet: ['ε','b','c'],
	transitionTable: [
		
	]
}

var x={
	pattern:'',
	alphabet: [],
	transitionTable: [
		
	]
}



var b= {
	pattern: 'a',
	alphabet: ['ε','a'],
	transitionTable: [
		[[],[1]],
		[[],[]]
	]
}
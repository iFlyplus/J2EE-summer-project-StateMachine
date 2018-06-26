// T = a*b?

var alphabet = ['ε', 'a', 'b'];
var transitionTable = [
	[[1,3],[],[]],  //0
	[[],[2],[]],    //1
	[[1,3],[],[]],  //2
	[[4],[],[]],    //3
	[[5],[],[5]],   //4
	[[],[],[]]      //5
];


/*
var acceptState2patternId = [
	{
		state: 3,
		REId: 0
	}, {
		state: 5,
		REId: 0
	}
];*/

var acceptState2patternId = [
 {
		state: 5,
		REId: 0
	}
];
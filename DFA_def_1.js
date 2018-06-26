// T = (a|b)*abb

var transitionTable = [
	[[1],[0]],  // 0
	[[1],[2]],  // 1
	[[1],[3]],  // 2
	[[1],[0]]   // 3
];

var alphabet = ['a', 'b'];

var acceptState2patternId = [
	{
		state: 3,
		REId: 0
	}
];
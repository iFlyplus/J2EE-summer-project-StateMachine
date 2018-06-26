var myNFA = create_NFA(transitionTable, alphabet, acceptState2patternId);
myNFA.init();

myNFA.feedText('dododouble');
myNFA.feedText('double');
myNFA.feedText('doubledodo');

myNFA.nextStep();

myNFA.preStep();






[
    {
        "x": 100,
        "y": 500,
        "id": "0",
        
        "connections": [
            1, 7
        ]
    },
    {
        "x": 200,
        "y": 500,
        "id": "1",
        
        "connections": [
            0, 2, 4, 6
        ]
    },
    {
        "x": 300,
        "y": 420,
        "id": "2",
        
        "connections": [
            1, 3
        ]
    },
    {
        "x": 400,
        "y": 420,
        "id": "3",
        
        "connections": [
            2, 6
        ]
    },
    {
        "x": 300,
        "y": 580,
        "id": "4",
        
        "connections": [
            1, 5
        ]
    },
    {
        "x": 400,
        "y": 580,
        "id": "5",
        
        "connections": [
            4, 6
        ]
    },
    {
        "x": 500,
        "y": 500,
        "id": "6",
        
        "connections": [
            1, 3, 5, 7
        ]
    },
    {
        "x": 600,
        "y": 500,
        "id": "7",
        
        "connections": [
            0, 6, 8
        ]
    },
    {
        "x": 700,
        "y": 500,
        "id": "8",
        
        "connections": [
            7, 9
        ]
    },
    {
        "x": 800,
        "y": 500,
        "id": "9",
        
        "connections": [
            8, 10
        ]
    },
    {
        "x": 900,
        "y": 500,
        "id": "10",
        
        "connections": [
            9
        ]
    }
]



[
    {
        "x": 100,
        "y": 500,
        "id": "0",
        "connections": [

        ]
    },
    {
        "x": 200,
        "y": 500,
        "id": "1",
        "connections": [

        ]
    },
    {
        "x": 300,
        "y": 420,
        "id": "2",
        "connections": [

        ]
    },
    {
        "x": 400,
        "y": 420,
        "id": "3",
        "connections": [

        ]
    },
    {
        "x": 300,
        "y": 580,
        "id": "4",
        "connections": [

        ]
    },
    {
        "x": 400,
        "y": 580,
        "id": "5",
        "connections": [

        ]
    },
    {
        "x": 500,
        "y": 500,
        "id": "6",
        "connections": [

        ]
    },
    {
        "x": 600,
        "y": 500,
        "id": "7",
        "connections": [

        ]
    },
    {
        "x": 700,
        "y": 500,
        "id": "8",
        "connections": [

        ]
    },
    {
        "x": 800,
        "y": 500,
        "id": "9",
        "connections": [

        ]
    },
    {
        "x": 900,
        "y": 500,
        "id": "10",
        "connections": [

        ]
    }
]
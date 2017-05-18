const SEV_WINS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function Player(game, player) {
	this.ID = player.ID; //id: 1 = First Player, 2 = Second Player;
	this.priority = player.priority;
	this.move = function(location) { 
		$("#" + location).off() //unbinds handler
						 .css("cursor", "default")
						 .children("span").html(player.letter) //changes in dom
						 				  .animate({opacity: 1}); 
		game.board.splice(location, 1, player.ID); //modifies board array
		game.turn++;
	}
	if (player.ai) {
		this.ai = true;
		this.passive = function() {
			if (game.turn == 2 && game.board[4] === 0) {
				this.move(4); //ai moves 4 every time going 2nd if free
			} else { 
				if (game.turn == 4) { //checks for special case on specific turn
					if ((game.board[0] == 1 && game.board[8] == 1) || (game.board[2] == 1 && game.board[6] == 1)) {
						var forceEdge = true;
					} else {
						var caseArr = [1, 3, 5, 7].filter(function(val) { //filters edge moves
							return game.board[val] == 1; // returns indexes with player 1
						});
						if (caseArr.length == 1) { //only 1 index
							var edgeCase = caseArr[0];
						}
						//**NOTE: if there would be more than one player1 edge move in the array at turn 4, it would mean we are in no threat of encountering the edge case
					}
				} else if (game.turn == 5 && game.board[4] === 0) {
					var totalEdge = [1, 3, 5, 7].filter(function(val) { //filters edge moves
						return game.board[val] == 1; // returns indexes with player 1
					}).length;
				}

				//performs actions depending on activated flags
				if (edgeCase) { //special case flag
					var plusminus = Math.random() < 0.5 ? -1 : 1;
					switch(edgeCase) { //move in adjacent corner to block
						case 1:
						case 7:
							this.move(plusminus * 1 + edgeCase); //randomizes adjacent spot
							break;
						case 3:
						case 5:
							this.move(plusminus * 3 + edgeCase); //randomizes adjacent spot
							break;
					}
				} else if (totalEdge > 1) {
					this.move(4);
				} else { //move truly passively
					var cross = [], edge = []; //categorize empty spaces
					for (var i = 0; i < game.board.length; i++) {
						if (game.board[i] === 0) {
							i % 2 === 0 ? cross.push(i) : edge.push(i);
						}
					}
					var crossLen = cross.length;
					if (crossLen > 0 && !forceEdge) {
						this.move(cross[randomizer(crossLen)]);
					} else {
						this.move(edge[randomizer(edge.length)]);
					}
				}
			}
		}
	}
}

function randomizer(arrlen) { //returns integer between 0 through arrlen-1
	return Math.floor(Math.random() * arrlen);
}

function Game(data) { //data = {ai: true || undefined, player: {ID: number, letter: string, priority: number, ai: boolean}}
	this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0]; //0 -> empty, 1 -> Player1, 2 -> Player2
	this.turn = 1; 
	this.wins = SEV_WINS.slice(); //shallow copy of the constant array
	this.player1 = new Player(this, data.player); 
	this.player2 = new Player(this, {	//player 2 options based on data.player(player 1)
										ID: 2, 
										letter: data.player.letter == "X" ? "O" : "X",
										priority: data.player.priority == 1 ? 2 : 1,
										ai: data.ai //true || undefined
									}); 
	
}

function initializeGame(prompt, data, step) {
	prompt = prompt ||  {
							body: $("#prompt"),
							message: $("#prompt-message"),
							choice1: $("#choice1"),
							choice2: $("#choice2")
						},
	data = data ||  {
						player: { ID: 1, priority: 1 }
					}, //holds options for new game constructor
	step = step || 1;

	var	message,
		choice1,
		choice2,
		easing = 250; //value necessary for animation speed

	/*
		1 Player: prompt 1 -> prompt 2 -> prompt 4 -> Game Start
		2 Players: prompt 1 -> prompt 3 -> Game Start
	*/

	if (step == 1) { //prompt 1
		message = "How many players?";
		choice1 = "1 Player";
		choice2 = "2 Players";
	} else if (step == 2 || step == 3) { //prompt 2
		message = "Choose X or O";
		if (step == 3) { //prompt 3
			message = "Player 1: " + message;
		}
		choice1 = "X";
		choice2 = "O";
	} else if (step == 4) {// prompt 4
		message = "Go First or Second?";
		choice1 = "First";
		choice2 = "Second";
	}

	prompt.message.html(message);

	//bind choice actions
	prompt.choice1.off().one("click", function() {
				  					var nextStep;
				  					if (step == 1) { // "How many players?"
				  						data.ai = true; // clicked: One player
				  						nextStep = 2; // next prompt: 2
				  					} else if (step == 2 || step == 3) { // "Choose X or O(1P || 2P)"
				  						data.player.letter = "X"; // clicked: X
				  						$("#player1").html("Player 1: X");
				  						$("#player2").html("Player 2: O");
				  						if (step == 2) { //if 1P
				  							nextStep = 4; // next prompt: 4
				  						}
				  					} // else if (step == 4)  // "Go First or Second?(1P)"
				  					//player.priority set to 1 by default, no change
				  					prompt.body.animate({
				  						opacity: 0,
				  						top: -20
				  					}, easing, function() {
					  					if (nextStep) {
											initializeGame(prompt, data, nextStep); //Next prompt
					  					} else {
					  						prompt.body.hide(); //prevents element from blocking input
					  						boardHandler(new Game(data), 1); //board setup
					  					}
				  					});
								})
				  .html(choice1);
	prompt.choice2.off().one("click", function() {
									var nextStep;
				  					if (step == 1) { // "How many players?"
				  						// clicked: Two Players; data.ai not created
				  						nextStep = 3; // next prompt: 3 
				  					} else if (step == 2 || step == 3) { //"Choose X or O(1P & 2P)""
				  						data.player.letter = "O"; // clicked: O
				  						$("#player1").html("Player 1: O");
				  						$("#player2").html("Player 2: X");
				  						if (step == 2) { //if 1P
				  							nextStep = 4; // next prompt: 4
				  						}
				  					} else if (step == 4) { // "Go First or Second?(1P)"
				  						data.player.priority = 2; // clicked: Second
				  					}

				  					prompt.body.animate({
				  						opacity: 0,
				  						top: -20
				  					}, easing, function() {
					  					if (nextStep) {
											initializeGame(prompt, data, nextStep); //Next prompt
					  					} else {
					  						//special circumstance, picking option 2 for prompt 4 requires special manipulation for ai
					  						var game = new Game(data),
					  							prioturn = 1;
					  						if (game.player2.ai && (game.player2.priority == prioturn)) {
					  							play(game);
					  							prioturn = 2;
					  						}
					  						prompt.body.hide(); //prevents element from blocking input
					  						boardHandler(game, prioturn);
					  					}
				  					});
								})
				  .html(choice2);

	$(".prompt-button")
		.mousedown(function() {
			$(this).css({
				"background-color": "#3D72A4",
				"color": "white"
			});
		})
		.mouseup(function() {
			$(this).css({
				"background-color": "white",
				"color": "black"
			});
		});

	prompt.body.show().animate({
		opacity: 1,
		top: 3
	}, easing);
	//switch to check prompt step
		//set message and choices to proper values
		//show prompt
		//modify dom object depending on the answer you receive
		//hide prompt
}

function boardHandler(game, prioTurn) {
	var p1name = $("#player1"),
		p2name = $("#player2"),
		turnOn = {
					"background-color": "white",
					"color": "black"
				 },
		turnOff = {
					"background-color": "#3D72A4",
					"color": "white"
				  };

	$(".space").off().each(function(i) {
		if (game.board[i] === 0) {
			$(this).one("click", function () {
				console.log("clicking ", this);
				if (game.player1.priority == prioTurn) {
					game.player1.move(i);
				} else if (game.player2.priority == prioTurn) {
					game.player2.move(i);
				}

				play(game);
			
				if (!game.player2.ai) { //switches board control to next player
					if (prioTurn == 1) {
						p1name.css(turnOff);
						p2name.css(turnOn);
						boardHandler(game, 2);
					} else {
						p2name.css(turnOff);
						p1name.css(turnOn);
						boardHandler(game, 1);
					}
				}
			})
			.css("cursor", "pointer");
		}
	});
}

function play(game) {
	var winning;
	if (game.player2.ai) { //special checks during ai game
		if (game.player2.priority === 1 && game.turn < 4) { //ai goes first
			game.player2.passive();
		} else if (game.player2.priority === 2 && game.turn < 3) { // ai goes second
			game.player2.passive();
		} else {
			winning = winCheck(game); //checks for win; assigns winner object if found
			if (winning) {
				winAnimation(winning); //strikethrough board animation
			} else if (game.turn > 9){
				endGame()(); //ends game, no winner
			}
		}
	} else { //wincheck every turn in non-ai game
		winning = winCheck(game); //checks for win; assigns winner object if found
		if (winning) {
			winAnimation(winning); //strikethrough board animation
		} else if (game.turn > 9){
			endGame()(); //ends game, no winner
		}
	}
}

function winAnimation(winning) {
	$(".space").off(); //prevents moves from being made;
	$("#strikethrough").css(setupStrikethrough(winning.array)).show()
	.children("div")
	.animate({width: "100%"}, endGame(winning.player)); //ends game with a winner
}

function endGame(winner) { //{player, array}
	return function() {
		var message = (winner) ? "Player " + winner + " Wins!" : "Stalemate!";
		$(".space").off(); //prevents moves from being made;
		$("#prompt-message").html(message);
		$("#choice2").hide(); //hides choice2 so choice1 can center display
		$("#choice1")
			.html("Play Again?")
			.css("width", 85) //elongates button so message displays better
			.one("click", function() {
				$("#prompt").animate({
					opacity: 0,
					top: -20
				}, 250, function() { //reset options
					$("#strikethrough").css("display", "none")
									   .children("div").css("width", 0);
					$(".player-name").css({
											"background-color": "#3D72A4",
											"color": "white"
										  });
					$("#prompt").hide(); //prevents element from blocking input
					$("#choice1").css("width", 65);
					$("#choice2").show(); // handled after the fade out
					$(".space").find("span")
									.html("")
							   		.css("opacity", 0); //cleans board 
					initializeGame(); //restarts game
				});
			});
		$("#prompt").show().animate({
			opacity: 1,
			top: 3
		}, 250);
	}
}

function setupStrikethrough(array) {
	var defaultWidth = 285,
		diagonalWidth = 380; //these manipulate strikethrough parent, not the inner div
	switch (array) {
		case SEV_WINS[0]:
			return {
					 transform: "none",
					 top: 97,
					 left: 58,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[1]:
			return {
					 transform: "none",
					 top: 198,
					 left: 58,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[2]:
			return {
					 transform: "none",
					 top: 299,
					 left: 58,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[3]:
			return {
					 transform: "rotate(90deg)",
					 top: 200,
					 left: -45,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[4]:
			return {
					 transform: "rotate(90deg)",
					 top: 200,
					 left: 58,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[5]:
			return {
					 transform: "rotate(90deg)",
					 top: 200,
					 left: 159,
					 width: defaultWidth	
				   };
			break;
		case SEV_WINS[6]:
			return {
					 transform: "rotate(45deg)",
					 top: 200,
					 left: 11,
					 width: diagonalWidth	
				   };
			break;
		case SEV_WINS[7]:
			return {
					 transform: "rotate(-45deg)",
					 top: 200,
					 left: 9,
					 width: diagonalWidth
				   };
			break;
	}
}

function winCheck(game) {
	var player1count, //tracks how many player one moves in a win
		player2count, //tracks how many player two moves in a win
		winner, //flags and saves winner

		//AI specific variables
		lastEmpty, //stores last available empty move
		current, //current move being evaluated
		counter, //stores last optimal counter move
		deletion = []; //stores any win indices that have been marked for deletion

	for (var win = 0; win < game.wins.length; win++) {
		player1count = 0, 
		player2count = 0, 
		lastEmpty = undefined;

		for (var move = 0; move < game.wins[win].length; move++) {
			current = game.wins[win][move];
			if (game.board[current] === game.player1.ID) {
				player1count++;
			} else if (game.board[current] === game.player2.ID) {
				player2count++;
			} else if (game.board[current] === 0 && game.player2.ai) {
				lastEmpty = current;
			}
		}

		if (game.player2.ai && (player1count + player2count > 1)) {
			if (lastEmpty >= 0) { //if an empty moves exists in this win
				if (player2count == 2) { //if we find AI win
					counter = lastEmpty;
					winner = game.player2.ID;
					break; //AI win, break
				} else if (player1count == 2) { // if we count a human win
					counter = lastEmpty; //Human win, keep looping in case we find AI win
				}
			}
			deletion.push(win); //mark this win for deletion
		} else if (player1count + player2count == 3){
			if (player1count == 3) {
				winner = game.player1.ID;// delcares player 1 as winner
				break;
			} else if (player2count == 3) {
				winner = game.player2.ID; //winner = player 2
				break;
			}
			deletion.push(win); //mark this win for deletion
		}
	}

	//executes countermove/win if found
	if (game.player2.ai) {
		if (counter >= 0) { //counter exists, >= used because 0 is falsy
			game.player2.move(counter);
		} else if (game.turn == 4 && ((game.board[0] == 1 && game.board[8] == 1) || (game.board[2] == 1 && game.board[6] == 1))) { //special case
			game.player2.passive(true); //force an edge move
		} else {
			game.player2.passive();
		}
	}

	if (winner) {
		return {player: winner, array: game.wins[win]}
		//endscreen(winner, win); might not even need to pass all of the winner object
	}

	//loop to delete extra elements from wins array
	if (deletion.length > 0) {
		multiSplice(game.wins, deletion);
	}
}

function multiSplice(arr, deleteElements) {
	var i = deleteElements.length;
	while(i--) { //iterated in reverse to preserver smaller index locations
		arr.splice(deleteElements[i], 1);
	}
}

$(function() {
	initializeGame();
});
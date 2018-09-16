/*
 * Nomes: Mateus Haas e Mathias Voelcker
 * Implementação: Client TCP
 */
const net = require('net')
const config = require("./config")
const helper = require("./helper")

//shorter name
const csl = helper.console

const socket = new net.Socket();

//execute main
(function() {
	csl.clear()
	csl.log("Welcome to Tic-Tac-Toe.")
	csl.debug("The program will try to connect on socket server.")

	let scope = this

	socket.connect(config.server.port, config.server.ip, () => {
		csl.debug("Connected successfully.")
		csl.debug("Will retrieve list of games")

		//show menu
		scope.menu.show()
	})

	socket.on("data", data => {
		scope.api._handleServerReturn(data)
	})

	socket.on("close", () => {
		csl.debug("Socket connection has been closed.")
		process.exit()
	})

	socket.on("error", () => {
		csl.log("Socket is not active. Please, try again.")
		process.exit()
	})

	scope.menu = {
		show: async () => {
			csl.log("Digite qual opção do menu você deseja navegar:")
			csl.log("[1] - Ver salas disponíveis")
			csl.log("[2] - Criar nova sala")
			csl.log("[3] - Créditos")

			let option = await csl.question("Opção")

			//clear the screen after input
			csl.clear()

			switch (option) {
				case "1":
					scope.menu.listRooms()
					break

				case "2":
					scope.menu.newRoom()
					break

				case "3":
					scope.menu.credits()
					break

				default:
					csl.log("Opção inválida.")
					scope.menu.show()
					break
			}
		},

		listRooms: async () => {
			let games = await scope.api.getAllRooms()

			if (games.length > 1) {
				csl.log("Lista de salas:")

				//Print rooms
				for (let i = 0; i < games.length ; i += 2)
					csl.log(`[${games[i]}] Sala '${games[i+1]}'.`)

				//Select room for joining
				scope.menu.selectRoomForJoin()
			}
			else {
				csl.log("Não há nenhuma sala cadastrada. Seja o primeiro a criar uma.")

				scope.game.show()
			}
		},

		selectRoomForJoin: async () => {
			//ask for room to join
			let roomId = await csl.question("\nInforme a sala que você quer entrar")

			scope.api.joinGame(roomId)
				.then(() => {
					//update game
					scope.game.current = {
						name: "sala x",
						id: roomId
					}

					//ok... wait for his turn
					scope.game.hisTurn()
				})
				.catch((e) => {
					//incorrect game
					csl.clear()
					csl.log(`Unexpected error while selecting room to join: ${e}`)

					scope.menu.listRooms()
				})
		},

		newRoom: async () => {
			let name = await csl.question("Digite o nome da sala")

			scope.api.createRoom(name)
				.then((result) => {
					//update the current game
					scope.game.current = {
						name: name,
						id: result[0]
					}

					//go to the game itself
					scope.game.waitingOtherPlayer()
				})
				.catch((e) => {
					csl.log(`Error while trying to create room '${e}'`)
				})
		},

		credits: () => {
			csl.log("Developed by Mathias Voelcker and Mateus Haas.")
			csl.log("")

			scope.menu.show()
		}
	},

	scope.game = {
		current: {},

		waitingOtherPlayer: () => {
			scope.game._printHeader()
			
			csl.log("Waiting for the other player to join the room...")
		},

		myTurn: async () => {
			await scope.game._turn(true)

			let response = {}

			while (1) {
				try {
					let move = await csl.question("Select one movement to play")

					response = await scope.api.play(scope.game.current.id, move)

					break
				}
				catch (e) {
					csl.log("Incorrect movement. Let's try again...")
				}
			}

			//check server response
			if (response[0] === "win")
				scope.game.myVictory()
			else
				scope.game.hisTurn()
		},

		hisTurn: async () => {
			await scope.game._turn()

			csl.log("Waiting for the other player to make his move...")
		},

		myVictory: async () => {
			await scope.game._printHeader()

			csl.log("Yey :). You won!")
		},

		myLost: async () => {
			await scope.game._printHeader()

			csl.log("Ohh :(. You lost. Improve your skills for next time.")
		},

		handlePushEvent: (event, args) => {
			switch (event) {
				case "YourTurn":
					scope.game.myTurn(args)
					break

				case "YouWin":
					scope.game.myVictory()
					break

				case "YouLoose":
					scope.game.myLost()
					break

				default:
					csl.debug(`Unexpected error. Push event '${event}' not found.`)
					break
			}
		},

		_turn: async (myTurn = false) => {
			await scope.game._printHeader()
			await scope.game._printBody(myTurn)
		},

		_printHeader: async () => {
			csl.clear()
			csl.log(`Welcome to room '${scope.game.current.name}'!`)
		},

		_printBody: async (myTurn) => {
			try {
				let matrix = await scope.api.gameSummary(scope.game.current.id)

				csl.log("")

				for (let i = 0, k = 0; i < 3; i++) {
					let line = "\t|"

					for (let j = 0; j < 3; j++, k++) {
						let piece = matrix[k]
						piece = (piece === '' ? (myTurn ? k : ' ') : piece)

						line += `${piece}|`

					}

					csl.log(line)
				}

				csl.log("")
			}
			catch (e) {
				csl.log(`Unexpected error while trying to display the game matrix: ${e}`)
			}
		}
	},

	scope.api = {
		_waitingPromises: {},

		_createPromise: method => {
			let promise = new Promise((res, rej) => {
				scope.api._waitingPromises[method] = [res, rej]
			})

			return promise
		},

		_callServer: (method, args) => {
			//parse args -> socket params
			let params = helper.args2Params(args)

			socket.write(method + config.separator + params)
		},

		call: (method, args = []) => {
			let promise = scope.api._createPromise(method)

			scope.api._callServer(method, args)

			return promise
		},

		getAllRooms: () => {
			return scope.api.call("ListGames")
		},

		createRoom: (name) => {
			return scope.api.call("NewGame", [ name ])
		},

		joinGame: id => {
			return scope.api.call("JoinGame", [ id ])
		},

		gameSummary: id => {
			return scope.api.call("GameSummary", [ id ])
		},

		play: (id, move) => {
			return scope.api.call("GamePlay", [ id, move ])
		},

		_handleServerReturn: (data) => {
			//parse returned data
			let args = helper.params2Args(data)

			console.log(args)

			//get method and status
			let method = args.shift()
			let status = args.shift()

			//get the promise
			let promise = scope.api._waitingPromises[method]

			if (promise !== null && promise !== undefined) {
				//decide if we are going to call the "resolve" or "reject"
				let invoke = status === "success" ? 0 : 1

				//invoke it
				promise[invoke](args)
			}
			//In case we were not expecting this return, it means this is a 'push' event
			else
				scope.game.handlePushEvent(method, args)
		}
	}

})()
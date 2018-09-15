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
		scope.api.handleServerReturn(data)
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

			let option = await csl.question("Opção... ")

			//clear the screen after input
			csl.clear()

			switch (option) {
				case "1":
					scope.menu.listRooms()
					break;

				case "2":
					scope.menu.newRoom()
					break;

				case "3":
					scope.menu.credits()
					break;
			}
		},

		listRooms: async () => {
			let games = await scope.api.getAllRooms()

			csl.log(games)
		},

		newRoom: () => {

		},

		credits: () => {
			csl.log("Developed by Mathias Voelcker and Mateus Haas.")
			csl.log("")

			scope.menu.show()
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

		_callServer: method => {
			socket.write(method)
		},

		call: method => {
			let promise = scope.api._createPromise(method)

			scope.api._callServer(method)

			return promise
		},

		getAllRooms: () => {
			return scope.api.call("ListGames")
		},

		handleServerReturn: (data) => {
			//parse returned data
			let args = helper.parseArgs(data)

			//get method and status
			let method = args.shift()
			let status = args.shift()

			//get the promise
			let promise = scope.api._waitingPromises[method]

			//TODO: if not found, decide what to do
			if (promise === null || promise === undefined) {
				//do somth
			}

			//decide if we are going to call the "resolve" or "reject"
			let invokeKey = status === "success" ? 0 : 1

			//invoke it
			promise[invokeKey](args)
		}
	}

})()
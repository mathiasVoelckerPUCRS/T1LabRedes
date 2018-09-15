/*
 * Nomes: Mateus Haas e Mathias Voelcker
 * Implementação: Server TCP
 */

const helper = require("./helper")
const config = require("./config")
const net = require('net')

//List of all games 
var games = []

//List of clients of the server
var clients = []

var server = net.createServer(client => {
    let scope = this

    //push this client to list of connected clients
    clients.push(client)

	client.on('error', err => {
	   console.log(`Unexpected error happened: ${err}`)
	})

	client.on('end', () => {
        //TODO: must check if there are running games
        //TODO: must remove from list of clients
  	})

	client.on('data', data => {
        let args = helper.params2Args(data)

        //Find the respective event the client is trying to call
        let event = "_on" + args[0] + "Event"

        //Validate if the event is valid
        if (!scope[event])
            return client.write(`Event '${args[0]}' not found.`)

        //Execute the event and store the result
        let result = scope[event](args)

        //Return the result
        client.write(args[0] + config.separator + result)
    })

    //Creation of new game
    scope._onNewGameEvent = (args) => {
        //check amount of arguments
        if (args.length < 2)
            return helper.response.error("invalid amount of args")

        //add the new game into the game's list
        games.push({
            name: args[1], //Game name
            owner: client, //Game's owner
            partner: null, //Game's partner (we don't have yet)
            matrix: [ '', '', '', '', '', '', '', '', '' ] //Game matrix
        })

        let id = games.length -1

        console.log(id, games.length)

        //return to user the game id
        return helper.response.success(id + "")
    }

    //List of all existing games
    scope._onListGamesEvent = (args) => {
        //Consolidate list of all games
        let result = games.map((g, k) => {
            return [
                k, //Game key
                g.name //Game name
            ].join(config.separator)
        }).join(`${config.separator};${config.separator}`)

        //return the list for the client
        return helper.response.success(result)
    }

    //Someone wants to join the game
    scope._onJoinGameEvent = (args) => {
        let gameKey = parseInt(args[1])

        //check if the game exists
        if (!games[gameKey])
            return helper.response.error("invalid game key")

        //Check if the game is already in place
        if (games[gameKey].partner !== null)
            return helper.response.error("game is already being played")

        //Get the game and update the partner
        games[gameKey].partner = client

        //let the owner know we are ready to play
        games[gameKey].client.write("ready")

        return helper.response.success()
    }

    //Game summary
    scope._onGameSummaryEvent = (args) => {
        let gameKey = parseInt(args[1])
        
        //check if the game exists
        if (!games[gameKey])
            return helper.response.error("invalid game key")

        //Get the game
        let game = games[gameKey]

        //Check if the game is yours
        if (game.partner !== client && game.owner !== client)
            return helper.response.error("game is not yours (duh)")

        //Get the matrix
        let result = game.matrix.split(config.separator)

        return helper.response.success(result)
    }

    //Game play
    scope._onGamePlayEvent = (args) => {
        //check amount of arguments
        if (args.length < 2)
            return helper.response.error("invalid amount of args")

        let key = parseInt(args[1])
        let move = parseInt(args[2])

        //check if the game exists
        if (!games[key])
            return helper.response.error("invalid game key")

        //Get the game
        let game = games[key]

        //Check if the game is yours
        if (game.partner !== client && game.owner !== client)
            return helper.response.error("game is not yours (duh)")

        //Get which character I am
        let character = game.owner === client ? "X" : "O"

        //check if the move is possible
        if (move < 0 || move > 8)
            return helper.response.error("move out of range")

        //check if the position was already taken
        if (game.matrix[move] !== '')
            return helper.response.error("position already taken")

        //commit the position
        game.matrix[move] = character

        //get the player two
        let playerTwo = game.owner === client ? game.partner : game.owner

        //check if I win
        if (helper.didIWin(game.matrix, character)) {
            //let the clients know that the game is done
            client.write("YouWin")
            playerTwo.write("YouLoose")

            //TODO: must end the game
        }
        else
            //let the other player know it's his turn to play  
            playerTwo.write("YourTurn")

        return helper.response.success()
    }
})

server.listen(config.server.port, config.server.ip)

console.log(`Server running on '${config.server.ip}:${config.server.port}'!`)
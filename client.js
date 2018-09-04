const readline = require('readline');
const net = require('net');
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var client = new net.Socket();

//execute main
main();

function main() {
	console.log("Bem-vindo ao programa Tic-Tac-Toe do Mathias e Haas.")

	getIp();
}

function getIp() {
	rl.question("Insira o endereço de IP do servidor:", ip => {
		rl.close();

		client.connect(6064, ip, () => {
			console.log("connected");
		});

		client.on("close", () => {
			console.log("closed");
		});

		client.on("error", () => {
			console.log("O socket não está ativo, ou você digitou o IP errado. Tente novamente.")
		});
	});
}
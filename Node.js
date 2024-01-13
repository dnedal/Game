// Server-Side Code: Node.js with WebSocket

// Import necessary modules
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

// Initialize Express application and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Game logic variables
let players = [];
let choices = { player1: null, player2: null };

// Function to reset game state
function resetGame() {
    choices = { player1: null, player2: null };
    players.forEach(player => player.send(JSON.stringify({ type: 'reset' })));
}

// Function to determine the game result
function determineResult() {
    if (choices.player1 === choices.player2) {
        return 'draw';
    } else if (choices.player1 === 'Launch' && choices.player2 === 'Hold') {
        return 'player1 wins';
    } else if (choices.player1 === 'Hold' && choices.player2 === 'Launch') {
        return 'player2 wins';
    } else {
        return 'both lose';
    }
}

// WebSocket server connection event
wss.on('connection', (ws) => {
    if (players.length < 2) {
        players.push(ws);
        ws.send(JSON.stringify({ type: 'connected', playerNumber: players.length }));
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game full' }));
        ws.close();
        return;
    }

    ws.on('message', (message) => {
        const { playerNumber, choice } = JSON.parse(message);
        choices[`player${playerNumber}`] = choice;

        if (choices.player1 && choices.player2) {
            const result = determineResult();
            players.forEach(player => player.send(JSON.stringify({ type: 'result', result })));
            resetGame();
        }
    });

    ws.on('close', () => {
        players = players.filter(player => player !== ws);
        resetGame();
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const ws = new WebSocket('ws://localhost:3000');
let playerNumber = null;
const launchButton = document.getElementById('launch');
const holdButton = document.getElementById('hold');
const resultDiv = document.getElementById('result');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'connected':
            playerNumber = data.playerNumber;
            console.log('Connected as Player ' + playerNumber);
            break;
        case 'result':
            resultDiv.textContent = 'Result: ' + data.result;
            break;
        case 'reset':
            resultDiv.textContent = '';
            break;
        case 'error':
            resultDiv.textContent = 'Error: ' + data.message;
            break;
    }
};

function sendChoice(choice) {
    const message = { playerNumber: playerNumber, choice: choice };
    ws.send(JSON.stringify(message));
}

launchButton.addEventListener('click', () => sendChoice('Launch'));
holdButton.addEventListener('click', () => sendChoice('Hold'));

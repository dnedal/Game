
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
let deck = [];

// Function to create and shuffle the deck
function createAndShuffleDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

// Function to draw a card
function drawCard() {
    if (deck.length > 0) {
        return deck.pop();
    } else {
        return null;
    }
}

// Function to update the display with the drawn cards and the winner
function updateDisplay(card1, card2, winner) {
    const player1Hand = document.getElementById('player1-hand');
    const player2Hand = document.getElementById('player2-hand');
    const resultDisplay = document.getElementById('result-display');

    player1Hand.textContent = card1 ? `${card1.rank} of ${card1.suit}` : '';
    player2Hand.textContent = card2 ? `${card2.rank} of ${card2.suit}` : '';
    resultDisplay.textContent = winner ? `Winner: ${winner}` : '';
}

// Function to compare two cards and determine the winner
function compareCards(card1, card2) {
    const rankOrder = ranks.indexOf(card1.rank) - ranks.indexOf(card2.rank);
    if (rankOrder > 0) return 'Player 1';
    else if (rankOrder < 0) return 'Player 2';
    else return 'Tie';
}

// Event listener for the draw button
document.addEventListener('DOMContentLoaded', function() {
    createAndShuffleDeck();
    const drawButton = document.getElementById('draw-button');
    drawButton.addEventListener('click', function() {
        const card1 = drawCard();
        const card2 = drawCard();
        const winner = card1 && card2 ? compareCards(card1, card2) : '';
        updateDisplay(card1, card2, winner);
    });
});

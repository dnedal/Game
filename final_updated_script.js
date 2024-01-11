
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
let deck = [];
let playerScores = { player1: 0, player2: 0 };

function createAndShuffleDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
    if (card.rank === 'Ace') return 1;
    if (['Jack', 'Queen', 'King'].includes(card.rank)) return 10;
    return parseInt(card.rank);
}

function drawCard() {
    return deck.length > 0 ? deck.pop() : null;
}

// Calculate the probability of Player 2 winning
function calculateWinProbability(player2Card) {
    const player2RankIndex = ranks.indexOf(player2Card.rank);
    // Higher ranked cards remaining in the deck reduce Player 2's chance of winning
    const higherCardsRemaining = ranks.length - 1 - player2RankIndex;
    return (deck.filter(card => ranks.indexOf(card.rank) > player2RankIndex).length) / deck.length;
}

// Function to play a round of the game
function playRound() {
    const prizeCard1 = drawCard();
    const prizeCard2 = drawCard();
    const costCard = drawCard();
    const player1Card = drawCard();
    const player2Card = drawCard();

    if (!prizeCard1 || !prizeCard2 || !costCard || !player1Card || !player2Card) {
        updateDisplay(null, null, 'Game Over');
        return;
    }

    const prizeValue = cardValue(prizeCard1) + cardValue(prizeCard2);
    const costValue = cardValue(costCard);
    const player1Proposal = prizeValue / 2; // Player 1's proposal (even division)
    const winProbability = calculateWinProbability(player2Card);
    const expectedUtility = winProbability * prizeValue - costValue;

    let winner;
    if (expectedUtility > player1Proposal) {
        // Player 2 decides to go to war
        winner = cardValue(player1Card) >= cardValue(player2Card) ? 'Player 1' : 'Player 2';
    } else {
        // Player 2 accepts the deal
        winner = 'Deal Accepted';
        playerScores.player1 += player1Proposal;
        playerScores.player2 += (prizeValue - player1Proposal);
    }

    if (winner !== 'Deal Accepted') {
        // Update scores after war
        if (winner === 'Player 1') {
            playerScores.player1 += prizeValue - costValue;
            playerScores.player2 -= costValue;
        } else {
            playerScores.player2 += prizeValue - costValue;
            playerScores.player1 -= costValue;
        }
    }

    updateDisplay(player1Card, player2Card, \`Winner: \${winner}, Player 1 Score: \${playerScores.player1}, Player 2 Score: \${playerScores.player2}\`);
}

function updateDisplay(player1Card, player2Card, result) {
    const player1Hand = document.getElementById('player1-hand');
    const player2Hand = document.getElementById('player2-hand');
    const resultDisplay = document.getElementById('result-display');

    player1Hand.textContent = player1Card ? \`\${player1Card.rank} of \${player1Card.suit}\` : '';
    player2Hand.textContent = player2Card ? \`\${player2Card.rank} of \${player2Card.suit}\` : '';
    resultDisplay.textContent = result;
}

document.addEventListener('DOMContentLoaded', function() {
    createAndShuffleDeck();
    const drawButton = document.getElementById('draw-button');
    drawButton.addEventListener('click', playRound);
});

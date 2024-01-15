// script.js

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    get imagePath() {
        return `${this.value}_of_${this.suit}.png`; // Image file path
            console.log("Drawn card:", imagePath); // Logging for debugging

    }

    getCardNumericValue() {
        if (this.value === 'ace') return 1; // Ace is low
        if (['jack'].includes(this.value)) return 11;
        if (['queen'].includes(this.value)) return 12;
        if (['king'].includes(this.value)) return 13;
        return parseInt(this.value);
    }
}

class Deck {
    constructor() {
        this.deck = [];
        this.reset();
    }

    reset() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push(new Card(suit, value));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    draw() {
        if (this.deck.length === 0) {
            this.reset();
        }
        return this.deck.pop();
    }
}

const deck = new Deck();
const prizeSection = document.getElementById('prize-cards');
const costSection = document.getElementById('cost-card');
const player1Section = document.getElementById('player1-card');
const player2Section = document.getElementById('player2-card');
const prizeValueDisplay = document.getElementById('prize-value');
const proposalSection = document.getElementById('proposal-value');
const drawButton = document.getElementById('draw-button');
const proposeButton = document.getElementById('propose-button');
proposeButton.disabled = true;
const slider = document.getElementById('prize-slider');
    const sliderValueDisplay = document.createElement('span');
    sliderValueDisplay.id = 'slider-value';
    slider.after(sliderValueDisplay); // Place the display right after the slider
const resultSection = document.getElementById('result-section');


let prizeValue = 0;
let costOfWar = 0;
let player1Capability = 0;
let player2Capability = 0;
let player1payoff = 0;
let player2payoff = 0;
let gameOutcomes = [];
let gameData = [];

drawButton.addEventListener('click', () => {
    // Draw prize cards
    const card1 = deck.draw();
    const card2 = deck.draw();
    prizeValue = card1.getCardNumericValue() + card2.getCardNumericValue();

    // Clear existing content and set class for prizeSection
    prizeSection.innerHTML = '';
    prizeSection.className = 'card-section';

    // Create and append images for prize cards
    const card1Img = createCardImage(card1);
    const card2Img = createCardImage(card2);

    prizeSection.appendChild(card1Img);
    prizeSection.appendChild(card2Img);
    prizeValueDisplay.innerHTML = `Prize Value: ${prizeValue}`;

    // Draw cost of war card
    const costCard = deck.draw();
    costOfWar = costCard.getCardNumericValue();

    // Clear existing content and set class for costSection
    costSection.innerHTML = '';
    costSection.className = 'card-section';

    // Create and append image for cost card
    const costCardImg = createCardImage(costCard);
    costSection.appendChild(costCardImg);

    // Draw capability cards
    const player1Card = deck.draw();
    const player2Card = deck.draw();
    player1Capability = player1Card.getCardNumericValue();
    player2Capability = player2Card.getCardNumericValue();

    // Clear existing content and set class for player sections
    player1Section.innerHTML = '';
    player1Section.className = 'card-section';
    player2Section.innerHTML = '';
    player2Section.className = 'card-section';

    // Create and append images for player cards
    const player1CardImg = createCardImage(player1Card);
    const player2CardImg = createCardImage(player2Card);

    player1Section.appendChild(player1CardImg);
    player2Section.appendChild(player2CardImg);

    // Update slider range
    slider.min = 0;
    slider.max = prizeValue;
    slider.value = prizeValue / 2;

     drawButton.disabled = true;
    proposeButton.disabled = false;

});

// Helper function to create a card image element
function createCardImage(card) {
    const img = document.createElement('img');
    img.src = card.imagePath;
    img.className = 'card-image';
    return img;
}


proposeButton.addEventListener('click', () => {
    const player1Offer = slider.value;
    proposalSection.innerHTML = `Player 1 offers: ${player1Offer} points`;
    const player2Decision = makeDecision(player1Offer, prizeValue, costOfWar, player2Capability, player1Capability);
    resultSection.innerHTML = player2Decision;

    // Register and display the outcome
    registerOutcome(resultSection.innerHTML);
     drawButton.disabled = false;
});

function makeDecision(offer, prize, cost, player2Cap, player1Cap) {
    const probabilityOfWinning = player2Cap >= player1Cap ? 1 : 0;
    const expectedUtility = probabilityOfWinning * prize - cost;
    if (offer >= expectedUtility) {
        updateAndDisplayPayoffs(prize - offer, offer);
        return `Player 2 accepts the offer. Player 1 gets ${prize - offer} points. Player 2 gets ${offer} points.`;
    } else {
        return goWar(player2Cap, player1Cap, prize, cost);
    }
}

function goWar(player2Cap, player1Cap, prize, cost) {
    if (player2Cap >= player1Cap) {
        updateAndDisplayPayoffs(prize - cost, 0-cost);
        return `Player 2 rejects the offer and chooses to fight! Player 2 wins the war! Player 2 gets ${prize - cost} points. Player 1 loses ${cost} points.`;
    } else if (player1Cap > player2Cap) {
                updateAndDisplayPayoffs(0-cost, prize - cost);
        return `Player 2 rejects the offer and chooses to fight. Player 1 wins the war! Player 1 gets ${prize - cost} points. Player 2 loses ${cost} points.`;
    }
}

function updateAndDisplayPayoffs(player1Points, player2Points) {
    player1payoff = player1Points;
    player2payoff = player2Points;
    
    registerValues(); // Call this function to update the displayed values
}

// New Function to Register and Display Numerical Values
function registerValues() {
    const valuesContainer = document.createElement('div');
    valuesContainer.id = 'values-container';
    valuesContainer.innerHTML = `
        <h3>Numerical Values</h3>
        <p>Prize Value: ${prizeValue}</p>
        <p>Cost of War: ${costOfWar}</p>
        <p>Player 1 Capability: ${player1Capability}</p>
        <p>Player 2 Capability: ${player2Capability}</p>
        <p>Player 1 Payoff: ${player1payoff}</p>
        <p>Player 2 Payoff: ${player2payoff}</p>
    `;
    document.getElementById('game-container').appendChild(valuesContainer);
    
     const payoffContainer = document.getElementById('payoff-container') || document.createElement('div');
    payoffContainer.id = 'payoff-container';
    payoffContainer.innerHTML = `
        <p>Player 1 Payoff this round: ${player1payoff}</p>
        <p>Player 2 Payoff this round: ${player2payoff}</p>
    `;
    document.getElementById('game-container').appendChild(payoffContainer);


gameData.push({ 
        type: 'Values', 
        prizeValue: prizeValue, 
        costOfWar: costOfWar, 
        player1Capability: player1Capability, 
        player2Capability: player2Capability,
        player1payoff: player1payoff,
        player2payoff: player2payoff
    });

 
}

function registerOutcome(outcomeMessage) {
// Append outcome to the game data
    gameData.push({ type: 'Outcome', detail: outcomeMessage });
}

function convertDataToCSV() {
    let csvContent = "data:text/csv;charset=utf-8," 
        + gameData.map(e => {
            return Object.keys(e).map(key => `${key}: ${e[key]}`).join(", ");
        }).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "game_data.csv");
    document.body.appendChild(link);

    link.click();
}

// Initial setup
window.onload = () => {
    deck.reset();
    
};

document.addEventListener('DOMContentLoaded', (event) => {
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Game Data as CSV';
    exportButton.onclick = convertDataToCSV;
    document.body.appendChild(exportButton);
     slider.oninput = function() {
        sliderValueDisplay.textContent = `Proposed share: ${this.value}`;
    };

});


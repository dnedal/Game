// script.js (version4.js in your HTML)

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    get imagePath() {
        return `${this.value}_of_${this.suit}.png`; // Image file path
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
const roundCounterDisplay = document.getElementById('roundCounterDisplay');
const proposeButton = document.getElementById('propose-button');
proposeButton.disabled = true;
const slider = document.getElementById('prize-slider');
const sliderValueDisplay = document.createElement('span');
sliderValueDisplay.id = 'slider-value';
slider.after(sliderValueDisplay); // Place the display right after the slider
const resultSection = document.getElementById('result-section');
const rpsChoicesDiv = document.getElementById('rpsChoices');

let player1Points = 30;
let player2Points = 30;
let prizeValue = 0;
let costOfWar = 0;
let player1Capability = 0;
let player2Capability = 0;
let player1payoff = 0;
let player2payoff = 0;
let roundCounter = 1;
let gameOutcomes = [];
let gameData = [];
let rpsOutcome = "";

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
    costSection.style.visibility = 'hidden'; // Hide the cost section

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
    rpsChoicesDiv.style.display = 'none'; // Hide RPS choices

});

// Helper function to create a card image element
function createCardImage(card) {
    const img = document.createElement('img');
    img.src = card.imagePath;
    img.className = 'card-image';
    return img;
}

proposeButton.addEventListener('click', () => {
    const player1Offer = parseInt(slider.value);
    const player2Decision = makeDecision(player1Offer, prizeValue, costOfWar, player2Capability, player1Capability);
    resultSection.innerHTML = player2Decision;
    costSection.style.visibility = 'visible';

    if (player2Decision.startsWith("Player 2 rejects")) {
        rpsChoicesDiv.style.display = 'block';
        // Disable slider and propose button after proposal if RPS is to be played
        slider.disabled = true;
        proposeButton.disabled = true;
    } else {
        drawButton.disabled = false;
        proposeButton.disabled = true;
        rpsChoicesDiv.style.display = 'none';
    }
});

function makeDecision(offer, prize, cost, player2Cap, player1Cap) {
  // Probability of winning RPS with rematches for ties is 1/2
    // Calculate the expected utility
const expectedUtility = (player1Cap > 2 * player2Cap ? 0 : (2 * player1Cap < player2Cap ? 1 : 0.5)) * prize - cost;
    if (offer >= expectedUtility) {
        outcome = 'Peaceful bargain'; // Setting outcome to Peaceful bargain
        updateAndDisplayPayoffs(prize - offer, offer);
        return `Player 2 accepts the offer. Player 1 gets ${prize - offer} points. Player 2 gets ${offer} points.`;
    } else {
        return `Player 2 rejects the offer and chooses to fight!`;
    }
}

function playerChoice(choice) {
    // Player 1 (human) makes their choice
    const player1Choice = choice;

    // Player 2 (computer) makes a random choice
    const choices = ['rock', 'paper', 'scissors'];
    const player2Choice = choices[Math.floor(Math.random() * 3)];

    // Determine the winner of RPS
    rpsOutcome = determineRPSWinner(player1Choice, player2Choice);

    // Display choices and outcome
    resultSection.innerHTML += `<br>Player 1 chose ${player1Choice}. Player 2 chose ${player2Choice}.<br>`;
    resultSection.innerHTML += `RPS Outcome: ${rpsOutcome}<br>`;

    // Adjust capabilities based on RPS outcome or handle rematch
    if (rpsOutcome === 'Tie, rematch RPS') {
        // Prompt for a rematch (no capability adjustments yet)
        resultSection.innerHTML += "It's a tie! Rematch!<br>";
        rpsChoicesDiv.style.display = 'block'; // Show RPS choices again
    } else {
        if (rpsOutcome === 'Player 1 wins RPS') {
            player1Capability *= 2;
        } else if (rpsOutcome === 'Player 2 wins RPS') {
            player2Capability *= 2;
        }

        // Hide RPS choices and proceed to war
        rpsChoicesDiv.style.display = 'none';
        goWar();
    }
}

function determineRPSWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) {
        return 'Tie, rematch RPS'; // Indicate a tie and rematch
    }

    if ((player1Choice === 'rock' && player2Choice === 'scissors') ||
        (player1Choice === 'paper' && player2Choice === 'rock') ||
        (player1Choice === 'scissors' && player2Choice === 'paper')) {
        return 'Player 1 wins RPS';
    } else {
        return 'Player 2 wins RPS';
    }
}

function goWar() {
    // This function is called after RPS is resolved (including any rematches)
    outcome = 'War';
    if (player1Capability > player2Capability) {
        updateAndDisplayPayoffs(prizeValue - costOfWar, 0 - costOfWar);
        resultSection.innerHTML += ` Player 1 wins the war! Player 1 gets ${prizeValue - costOfWar} points. Player 2 loses ${costOfWar} points.`;
    } else {
        updateAndDisplayPayoffs(0 - costOfWar, prizeValue - costOfWar);
        resultSection.innerHTML += ` Player 2 wins the war! Player 2 gets ${prizeValue - costOfWar} points. Player 1 loses ${costOfWar} points.`;
    }

    // Re-enable slider and propose button for the next round
    slider.disabled = false;
    proposeButton.disabled = true; // Propose button should be disabled at the start of each round
    drawButton.disabled = false;
}


function updateAndDisplayPayoffs(player1payoff, player2payoff) {
    player1Points += parseInt(player1payoff);
    player2Points += parseInt(player2payoff);

    checkWinLoseCondition();  // Check for win/lose conditions after updating points

    registerValues(player1payoff, player2payoff); // Update displayed values
}

function checkWinLoseCondition(player1payoff, player2payoff) {
    if (player1Points >= 100) {
        endGame("Player 1 has become a superpower and wins the game!");
    } else if (player2Points >= 100) {
        endGame("Player 2 has become a superpower and wins the game!");
    } else if (player1Points <= 0) {
        endGame("Player 1 is knocked out. Player 2 wins!");
    } else if (player2Points <= 0) {
        endGame("Player 2 is knocked out. Player 1 wins!");
    }
}

// Function to Register and Display Numerical Values
function registerValues(player1payoff, player2payoff) {
    const valuesContainer = document.createElement('div');
    valuesContainer.id = 'values-container';
    valuesContainer.innerHTML = `
        <h3>Numerical Values</h3>
        <p>Round: ${roundCounter}</p>
        <p>Prize Value: ${prizeValue}</p>
        <p>Cost of War: ${costOfWar}</p>
        <p>Player 1 Capability: ${player1Capability}</p>
        <p>Player 2 Capability: ${player2Capability}</p>
        <p>Outcome: ${outcome}</p>
        <p>RPS Outcome: ${rpsOutcome}</p>
        <p>Offer: ${slider.value}</p>
        <p>Player 1 Points: ${player1Points}</p>
        <p>Player 2 Points: ${player2Points}</p>
    `;
    roundCounter++;
    roundCounterDisplay.innerHTML = `Round: ${roundCounter}`;
    document.getElementById('game-container').appendChild(valuesContainer);

    const payoffContainer = document.getElementById('payoff-container') || document.createElement('div');
    payoffContainer.id = 'payoff-container';
    payoffContainer.innerHTML = `
        <p>Player 1 Payoff this round: ${player1payoff}</p>
        <p>Player 2 Payoff this round: ${player2payoff}</p>
    `;
    document.getElementById('game-container').appendChild(payoffContainer);

// Handle cases where RPS is not played
    if (outcome === 'Peaceful bargain') {
        rpsOutcome = "Not played";
    }

    gameData.push({
        type: 'Values',
        round: roundCounter,
        prizeValue: prizeValue,
        costOfWar: costOfWar,
        player1Capability: player1Capability,
        player2Capability: player2Capability,
        player1payoff: player1payoff,
        player2payoff: player2payoff,
        player1Points: player1Points,
        player2Points: player2Points,
        outcome: outcome,
        rpsOutcome: rpsOutcome  // rpsOutcome will be "Not played" if there was no RPS
    });

    // Reset rpsOutcome for the next round
    rpsOutcome = "";
}

function registerOutcome(outcomeMessage) {
    // Append outcome to the game data
    gameData.push({ type: 'Outcome', detail: outcomeMessage });
}

function endGame(message) {
    alert(message); // Display win/lose message
    // Disable game controls to prevent further play
    drawButton.disabled = true;
    proposeButton.disabled = true;
    slider.disabled = true;
    convertDataToCSV();
    // Additional code to handle game end scenario
}

function convertDataToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,"
        + gameData.map(e => {
            return Object.keys(e).map(key => `${key}: ${e[key]}`).join(", ");
        }).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gamingwar_v4_results.csv");
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
    slider.oninput = function () {
        let thisValue = this.value;
        let remainingValue = prizeValue - thisValue;
        sliderValueDisplay.textContent = `Player 1: ${remainingValue}, Player 2: ${thisValue}`;
    };

});

const instructionsButton = document.getElementById('instructionsButton');
const popupWindow = document.getElementById('popupWindow');
const closeButton = document.querySelector('.close');

instructionsButton.onclick = function () {
    popupWindow.style.display = 'block';
};

closeButton.onclick = function () {
    popupWindow.style.display = 'none';
};

// Optional: Close the popup if user clicks anywhere outside of it
window.onclick = function (event) {
    if (event.target == popupWindow) {
        popupWindow.style.display = 'none';
    }
};
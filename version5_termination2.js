// script.js

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
const retreatButton = document.getElementById('retreat-button');
const fightButton = document.getElementById('fight-button');
const slider = document.getElementById('prize-slider');
    const sliderValueDisplay = document.createElement('span');
    sliderValueDisplay.id = 'slider-value';
    slider.after(sliderValueDisplay); // Place the display right after the slider
const resultSection = document.getElementById('result-section');

let player1Points = 30;
let player2Points = 30;
let prizeValue = 0;
let costOfWar = 0;
let player1Capability = 0;
let player2Capability = 0;
let player1payoff = 0;
let player2payoff = 0;
let roundCounter = 1;
let outcome = [];
let gameOutcomes = [];
let gameData = [];
let warCosts = []; // To track cumulative war costs
let consecutiveCeaseFires = 0;


drawButton.addEventListener('click', () => {
    // Draw prize cards
    const card1 = deck.draw();
    const card2 = deck.draw();
    prizeValue = card1.getCardNumericValue() + card2.getCardNumericValue();

// Reset and display the prize
resetAndDisplayPrizeSection(card1, card2);

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
    if (warCosts.length > 0) {
        // Add the new cost to the cumulative cost
        costOfWar += costCard.getCardNumericValue();
    } else {
        // Set initial cost of war
        costOfWar = costCard.getCardNumericValue();
    }
    warCosts.push(costCard); // Add the cost card to the array
    costOfWar = warCosts.reduce((acc, card) => acc + card.getCardNumericValue(), 0); // Sum up cumulative cost


    // Clear existing content and set class for costSection
    costSection.innerHTML = '';
    costSection.className = 'card-section';

     // Display the cumulative cost without revealing it immediately
    costSection.innerHTML = '';
    costSection.className = 'card-section';
    warCosts.forEach(costCard => {
        const costCardImg = createCardImage(costCard);
        costSection.appendChild(costCardImg);
    });
    costSection.style.visibility = 'hidden'; // Initially hide the cost
 
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
    retreatButton.disabled = false;
    fightButton.disabled = false;
    sliderValueDisplay.textContent = `Adjust the slider to propose a division of the prize`;

});


// Helper function to create a card image element
function createCardImage(card) {
    const img = document.createElement('img');
    img.src = card.imagePath;
    img.className = 'card-image';
    return img;
}

retreatButton.addEventListener('click', () => {
    handleRetreat();
});

fightButton.addEventListener('click', () => {
    handleFight();
});

function handleRetreat() {
    consecutiveCeaseFires = 0; // Reset the counter if the decision is to fight // Player 1 concedes half the prize to Player 2 // Update Player 2's points
    // Player 1 does not incur the cost of war
    costSection.style.visibility = 'visible'; // Optionally show the costs to indicate they were avoided
    outcome = 'Retreat'; // Set the outcome
    resultSection.innerHTML = `Player 1 retreats. Player 2 gains ${prizeValue/2} points. Cumulative cost was avoided.`;
    registerOutcome(resultSection.innerHTML);
    drawButton.disabled = false;
    proposeButton.disabled = true;
    retreatButton.disabled = true;
    fightButton.disabled = true;
    updateAndDisplayPayoffs(0, prizeValue/2); // Update payoffs accordingly
    checkWinLoseCondition();
    updateMarkerPosition();

}


function handleFight() {
    let winMessage;
    consecutiveCeaseFires = 0; // Reset the counter if the decision is to fight
    if (player2Capability >= player1Capability) {
        // Player 1 loses the fight
        player1Points - costOfWar; // Player 1 pays the cumulative cost
        player2Points + (prizeValue - costOfWar); // Player 2 wins the prize but also pays the cumulative cost

        winMessage = `Player 1 chose to fight and lost the battle! Player 2 gets ${prizeValue - costOfWar} points. Player 1 loses ${costOfWar} points.`;
        updateAndDisplayPayoffs(-costOfWar, prizeValue - costOfWar);
        updateMarkerPosition();

    } else {
        // Player 1 wins the fight
        player1Points + prizeValue - costOfWar; // Player 1 wins the prize but pays the cumulative cost
        player2Points - costOfWar; // Player 2 only pays the cumulative cost

        winMessage = `Player 1 chose to fight and won the battle! Player 1 gets ${prizeValue - costOfWar} points. Player 2 loses ${costOfWar} points.`;
        updateAndDisplayPayoffs(prizeValue - costOfWar, - costOfWar);
        updateMarkerPosition();

    }

    outcome = 'Fight'; // Update the outcome
    resultSection.innerHTML = winMessage; // Display the fight outcome in the result section
    registerOutcome(winMessage); // Log the outcome for game data

    // Update UI and game state to reflect the new points and check for win/lose conditions
    checkWinLoseCondition();
    costSection.style.visibility = 'visible'; // Show the cost section

    // Reset UI elements for the next round or game end
    drawButton.disabled = false;
    proposeButton.disabled = true;
    retreatButton.disabled = true;
    fightButton.disabled = true;
}



proposeButton.addEventListener('click', () => {
    const player1Offer = slider.value;
    const player2Decision = makeDecision(player1Offer, prizeValue, costOfWar, player2Capability, player1Capability);
    resultSection.innerHTML = player2Decision;
    costSection.style.visibility = 'visible'; // Show the cost section
    
  resultSection.innerHTML = player2Decision;

    // Register and display the outcome
    registerOutcome(resultSection.innerHTML);
     drawButton.disabled = false;
        proposeButton.disabled = true;
        retreatButton.disabled = true;
        fightButton.disabled = true;

});

function makeDecision(offer, prize, cumulativeCost, player2Cap, player1Cap) {
    const expectedUtility = (player2Capability >= player1Capability ? prize : 0) - cumulativeCost;
 if (prize - offer + player1Points - player2Points >= 100) { // If accepting the offer gets Player 1 to victory
        // Player 2 decides to go to war to prevent Player 1 from potentially winning the game
        return goWar(player1Cap, player2Cap, prize, cumulativeCost);
    } else {
        // If the offer is equal to or greater than the expected utility, a cease-fire is achieved
        if (offer >= expectedUtility) {
            outcome = 'Cease-fire'; // Setting outcome to cease-fire
            updateAndDisplayPayoffs(prize - offer, offer);
                            updateMarkerPosition();
                            consecutiveCeaseFires++; // Increment the cease-fire counter
            checkForStalemate(); // Check if this cease-fire leads to a stalemate
            return `Cease-fire achieved. Player 1 gains ${prize - offer}, Player 2 gains ${offer}. Cumulative cost of ${cumulativeCost} avoided...for now!`;
        } else {
            // If the offer is not acceptable, go to war
            consecutiveCeaseFires = 0; // Reset the counter if the decision is to fight
            return goWar(player1Cap, player2Cap, prize, cumulativeCost);
        }
    }
}


function goWar(player2Cap, player1Cap, prize, cumulativeCost) {
    outcome = 'Fighting continues'; // Setting outcome to fighting continues
    if (player2Capability >= player1Capability) {
        updateAndDisplayPayoffs(0-cumulativeCost, prize-cumulativeCost);
        updateMarkerPosition()
        return `Player 2 rejects the offer and chooses to continue fighting! Player 2 wins the battle! Player 2 gets ${prize - cumulativeCost} points. Player 1 loses ${cumulativeCost} points.`;
    } else {
                updateAndDisplayPayoffs(prize - cumulativeCost,0-cumulativeCost);
                updateMarkerPosition();
        return `Player 2 rejects the offer and chooses to continue fighting. Player 1 wins the battle! Player 1 gets ${prize - cumulativeCost} points. Player 2 loses ${cumulativeCost} points.`;
    }
}


// Additional helper functions
function resetAndDisplayPrizeSection(card1, card2) {
    // Function to reset and display the prize section
}


function updateAndDisplayPayoffs(player1payoff, player2payoff) {
    player1Points += parseInt(player1payoff);
    player2Points += parseInt(player2payoff);
    
    checkWinLoseCondition();  // Check for win/lose conditions after updating points


    registerValues(player1payoff, player2payoff); // Call this function to update the displayed values
}

function checkWinLoseCondition(player1payoff, player2payoff) {
    if (player1Points - player2Points >= 100) {
        endGame("The United Nations have defeated the communist forces and won the war! The Korean Peninsula is free and united!");
    } else if (player2Points - player1Points >= 100) {
        endGame("North Korea has expelled the United Nations from the peninsula and has won the war! Glory to Kim Il Sung, to a United Korea, and to the workers of the world!");
    } else if (player1Points <= 0) {
        endGame("The United States has sued for peace. North Korea wins the war! Glory to Kim Il Sung, to a United Korea, and to the workers of the world!");
    } else if (player2Points <= -100) {
        endGame("North Korea 2 has sued for peace. The United Nations wins the war! The Korean Peninsula is free and united!");
    }
}

// New Function to Register and Display Numerical Values
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


gameData.push({ 
        type: 'Values', 
        prizeValue: prizeValue, 
        costOfWar: costOfWar, 
        player1Capability: player1Capability, 
        player2Capability: player2Capability,
        player1payoff: player1payoff,
        player2payoff: player2payoff,
        player1Points: player1Points,
        player2Points: player2Points,
        outcome: outcome
    });

 
}

function updateMarkerPosition() {
    // Assuming each point difference moves the marker 1% from its starting position
    const pointsDifference = player1Points - player2Points;
    
    // Calculate the new bottom position
    // Initial position is 44, and we adjust based on the points difference
    // The factor (e.g., 0.5) adjusts how sensitively the marker moves per point difference
    let newBottomPosition = 44 + (pointsDifference * 0.5);
    
    // Constrain the new bottom position to remain within the map boundaries
    newBottomPosition = Math.max(newBottomPosition, 15); // Adjust with actual minimum, e.g., 15
    newBottomPosition = Math.min(newBottomPosition, 85); // Adjust with actual maximum, e.g., 85
    
    // Update the marker's bottom position
    const marker = document.getElementById('marker');
    marker.style.bottom = `${newBottomPosition}%`;
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
    retreatButton.disabled = true;
    fightButton.disabled = true;
    slider.disabled = true;
    convertDataToCSV();
    // Additional code to handle game end scenario
}

function checkForStalemate() {
    if (consecutiveCeaseFires >= 3) {
        endGame("Three consecutive cease-fires have turned to an uneasy armistice, effectively ending the war...for now!");
    }
}

function convertDataToCSV() {
    let csvContent = "data:text/csv;charset=utf-8," 
        + gameData.map(e => {
            return Object.keys(e).map(key => `${key}: ${e[key]}`).join(", ");
        }).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gamingwar_v3_results.csv");
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
        let thisValue = this.value;
    let remainingValue = prizeValue - thisValue;
        sliderValueDisplay.textContent = `Player 1: ${remainingValue}, Player 2: ${thisValue}`;
    };

});

const instructionsButton = document.getElementById('instructionsButton');
const popupWindow = document.getElementById('popupWindow');
const closeButton = document.querySelector('.close');

instructionsButton.onclick = function() {
    popupWindow.style.display = 'block';
};

closeButton.onclick = function() {
    popupWindow.style.display = 'none';
};

// Optional: Close the popup if user clicks anywhere outside of it
window.onclick = function(event) {
    if (event.target == popupWindow) {
        popupWindow.style.display = 'none';
    }
};

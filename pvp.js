 // Card and Deck Classes
        class Card {
            constructor(suit, value) {
                this.suit = suit;
                this.value = value;
            }

            get imagePath() {
                return `${this.value}_of_${this.suit}.png`;
            }

            getCardNumericValue() {
                if (this.value === 'ace') return 1;
                if (this.value === 'jack') return 11;
                if (this.value === 'queen') return 12;
                if (this.value === 'king') return 13;
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

        // Game State
        let deck = new Deck();
        let prizeValue = 0;
        let costOfWar = 0;
        let player1Capability = 0;
        let player2Capability = 0;
        let player1payoff = 0;
        let player2payoff = 0;
        let roundCounter = 1;
        let gameOutcomes = [];
        let gameData = [];
        let outcome = '';
        let playerRole = null;
        let currentProposal = 0;
        let seed = Date.now();

        // P2P Connection
        let peer = null;
        let conn = null;
        let isHost = false;

        // DOM Elements
        const createButton = document.getElementById('create-button');
        const joinButton = document.getElementById('join-button');
        const roomIdInput = document.getElementById('room-id-input');
        const roomIdDisplay = document.getElementById('room-id');
        const roomCreatedDiv = document.getElementById('room-created');
        const copyRoomIdButton = document.getElementById('copy-room-id');
        const statusDiv = document.getElementById('status');
        const waitingScreen = document.getElementById('waiting-screen');
        const gameContent = document.getElementById('game-content');
        const connectionContainer = document.getElementById('connection-container');
        const playerRoleDisplay = document.getElementById('player-role');
        
        const player1Controls = document.getElementById('player1-controls');
        const player1ProposalControls = document.getElementById('player1-proposal-controls');
        const player2DecisionControls = document.getElementById('player2-decision-controls');
        const opponentDecision = document.getElementById('opponent-decision');
        const nextRoundControls = document.getElementById('next-round-controls');
        const chatContainer = document.getElementById('chat-container');
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        const sendChatButton = document.getElementById('send-chat');
        const exportButton = document.getElementById('export-button');
        
        const drawButton = document.getElementById('draw-button');
        const proposeButton = document.getElementById('propose-button');
        const acceptButton = document.getElementById('accept-button');
        const rejectButton = document.getElementById('reject-button');
        const nextRoundButton = document.getElementById('next-round-button');
        
        const prizeSection = document.getElementById('prize-cards');
        const costSection = document.getElementById('cost-card');
        const player1Section = document.getElementById('player1-card');
        const player2Section = document.getElementById('player2-card');
        const prizeValueDisplay = document.getElementById('prize-value');
        const proposalDisplay = document.getElementById('proposal-display');
        const resultSection = document.getElementById('result-section');
        const payoffContainer = document.getElementById('payoff-container');
        const roundCounterDisplay = document.getElementById('roundCounterDisplay');
        
        const slider = document.getElementById('prize-slider');
        const sliderValueDisplay = document.getElementById('slider-value');
        
        const instructionsButton = document.getElementById('instructionsButton');
        const popupWindow = document.getElementById('popupWindow');
        const closeButton = document.querySelector('.close');

        // Initialize PeerJS connection
        function initializePeer() {
            peer = new Peer(null, {
                debug: 2
            });
            
            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
            });
            
            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                statusDiv.textContent = "Connection error: " + err.type;
                statusDiv.style.color = 'red';
            });
        }

        // Create a new game room
        createButton.addEventListener('click', () => {
            initializePeer();
            
            peer.on('open', (id) => {
                roomIdDisplay.value = id;
                roomCreatedDiv.classList.remove('hidden');
                statusDiv.textContent = 'Room created. Waiting for opponent...';
                waitingScreen.classList.remove('hidden');
                createButton.disabled = true;
                joinButton.disabled = true;
                isHost = true;
            });
            
            peer.on('connection', (connection) => {
                conn = connection;
                setupConnectionHandlers();
                waitingScreen.classList.add('hidden');
                connectionContainer.classList.add('hidden');
                gameContent.classList.remove('hidden');
                chatContainer.classList.remove('hidden');
                exportButton.classList.remove('hidden');
                
                playerRole = 'player1';
                playerRoleDisplay.textContent = 'You are Player 1 (Proposer)';
                player1Controls.classList.remove('hidden');
                
                statusDiv.textContent = 'Connected to opponent!';
                statusDiv.style.color = 'green';
                
                // Send initial game state
                sendGameState();
            });
        });

        // Join an existing game room
        joinButton.addEventListener('click', () => {
            const roomId = roomIdInput.value.trim();
            if (!roomId) {
                alert('Please enter a valid Room ID');
                return;
            }
            
            initializePeer();
            
            peer.on('open', (id) => {
                conn = peer.connect(roomId);
                setupConnectionHandlers();
                
                conn.on('open', () => {
                    statusDiv.textContent = 'Connected to room!';
                    statusDiv.style.color = 'green';
                    connectionContainer.classList.add('hidden');
                    gameContent.classList.remove('hidden');
                    chatContainer.classList.remove('hidden');
                    exportButton.classList.remove('hidden');
                    
                    playerRole = 'player2';
                    playerRoleDisplay.textContent = 'You are Player 2 (Responder)';
                    
                    // Send ready message
                    conn.send({
                        type: 'ready'
                    });
                });
            });
        });

        // Copy room ID to clipboard
        copyRoomIdButton.addEventListener('click', () => {
            roomIdDisplay.select();
            document.execCommand('copy');
            alert('Room ID copied to clipboard!');
        });

        // Setup connection event handlers
        function setupConnectionHandlers() {
            conn.on('data', handleDataReceived);
            
            conn.on('close', () => {
                statusDiv.textContent = 'Connection closed';
                statusDiv.style.color = 'red';
                alert('Your opponent has disconnected.');
                resetGameInterface();
            });
            
            conn.on('error', (err) => {
                console.error('Connection error:', err);
                statusDiv.textContent = "Connection error: " + err;
                statusDiv.style.color = 'red';
            });
        }

        // Handle incoming data
        function handleDataReceived(data) {
            console.log('Received data:', data);
            
            switch (data.type) {
                case 'ready':
                    // Opponent is ready
                    break;
                    
                case 'gameState':
                    updateGameState(data);
                    break;
                    
                case 'drawCards':
                    handleDrawCards(data);
                    break;
                    
                case 'proposal':
                    handleProposal(data);
                    break;
                    
                case 'decision':
                    handleDecision(data);
                    break;
                    
                case 'nextRound':
                    handleNextRound();
                    break;
                    
                case 'chat':
                    addChatMessage('Opponent', data.message);
                    break;
            }
        }

        // Send game state to peer
        function sendGameState() {
            if (!conn) return;
            
            conn.send({
                type: 'gameState',
                roundCounter: roundCounter,
                playerRole: playerRole === 'player1' ? 'player2' : 'player1'
            });
        }

        // Update game state from received data
        function updateGameState(data) {
            roundCounter = data.roundCounter;
            roundCounterDisplay.textContent = "Round: " + roundCounter;
        }

        // Draw Button Handler
        drawButton.addEventListener('click', () => {
            if (playerRole !== 'player1') return;
            
            // Generate seed for synchronized random
            seed = Date.now();
            
            // Draw cards
            const drawnCards = drawCards();
            
            // Display cards
            displayCards(drawnCards);
            
            // Send card data to other player
            conn.send({
                type: 'drawCards',
                cards: drawnCards,
                seed: seed
            });
            
            // Update UI
            drawButton.disabled = true;
            player1ProposalControls.classList.remove('hidden');
        });

        // Handle received draw cards data
        function handleDrawCards(data) {
            // Set the seed for synchronized random
            seed = data.seed;
            
            // Display the cards
            displayCards(data.cards);
        }

        // Draw cards
        function drawCards() {
            // Reset deck with seed
            deck = new Deck();
            // Note: Using Math.random as seedrandom may not be available
            deck.shuffle();
            
            // Draw prize cards
            const prizeCard1 = deck.draw();
            const prizeCard2 = deck.draw();
            
            // Draw cost card
            const costCard = deck.draw();
            
            // Draw capability cards
            const player1Card = deck.draw();
            const player2Card = deck.draw();
            
            return {
                prizeCard1: {
                    suit: prizeCard1.suit,
                    value: prizeCard1.value,
                    numericValue: prizeCard1.getCardNumericValue()
                },
                prizeCard2: {
                    suit: prizeCard2.suit,
                    value: prizeCard2.value,
                    numericValue: prizeCard2.getCardNumericValue()
                },
                costCard: {
                    suit: costCard.suit,
                    value: costCard.value,
                    numericValue: costCard.getCardNumericValue()
                },
                player1Card: {
                    suit: player1Card.suit,
                    value: player1Card.value,
                    numericValue: player1Card.getCardNumericValue()
                },
                player2Card: {
                    suit: player2Card.suit,
                    value: player2Card.value,
                    numericValue: player2Card.getCardNumericValue()
                }
            };
        }

        // Display cards on the interface
        function displayCards(cards) {
            // Convert data back to Card objects
            const prizeCard1 = new Card(cards.prizeCard1.suit, cards.prizeCard1.value);
            const prizeCard2 = new Card(cards.prizeCard2.suit, cards.prizeCard2.value);
            const costCard = new Card(cards.costCard.suit, cards.costCard.value);
            const player1Card = new Card(cards.player1Card.suit, cards.player1Card.value);
            const player2Card = new Card(cards.player2Card.suit, cards.player2Card.value);
            
            // Calculate values
            prizeValue = cards.prizeCard1.numericValue + cards.prizeCard2.numericValue;
            costOfWar = cards.costCard.numericValue;
            player1Capability = cards.player1Card.numericValue;
            player2Capability = cards.player2Card.numericValue;
            
            // Clear existing content
            prizeSection.innerHTML = '';
            costSection.innerHTML = '';
            player1Section.innerHTML = '';
            player2Section.innerHTML = '';
            
            // Add card section classes
            prizeSection.className = 'card-section';
            costSection.className = 'card-section';
            player1Section.className = 'card-section';
            player2Section.className = 'card-section';
            
            // Create and append card images
            prizeSection.appendChild(createCardImage(prizeCard1));
            prizeSection.appendChild(createCardImage(prizeCard2));
            costSection.appendChild(createCardImage(costCard));
            
            // Display cards based on player role
            if (playerRole === 'player1') {
                player1Section.appendChild(createCardImage(player1Card));
                player2Section.appendChild(createCardImage(player2Card));
            } else {
                player1Section.appendChild(createCardImage(player2Card));
                player2Section.appendChild(createCardImage(player1Card));
            }
            
            // Update displays
            prizeValueDisplay.innerHTML = "Prize Value: " + prizeValue;
            
            // Update slider range
            slider.min = 0;
            slider.max = prizeValue;
            slider.value = Math.floor(prizeValue / 2);
            updateSliderDisplay();
        }

        // Helper function to create card image
        function createCardImage(card) {
            const img = document.createElement('img');
            img.src = card.imagePath;
            img.className = 'card-image';
            img.alt = card.value + " of " + card.suit;
            return img;
        }

        // Update slider display
        function updateSliderDisplay() {
            if (playerRole === 'player1') {
                const player2Value = parseInt(slider.value);
                const player1Value = prizeValue - player2Value;
                sliderValueDisplay.textContent = "You: " + player1Value + ", Opponent: " + player2Value;
            }
        }

        // Slider input handler
        slider.addEventListener('input', updateSliderDisplay);

        // Propose button handler
        proposeButton.addEventListener('click', () => {
            if (playerRole !== 'player1') return;
            
            currentProposal = parseInt(slider.value);
            
            // Send proposal to other player
            conn.send({
                type: 'proposal',
                value: currentProposal
            });
            
            // Update UI
            proposeButton.disabled = true;
            resultSection.innerHTML = 'Waiting for opponent to respond...';
        });

        // Handle received proposal
        function handleProposal(data) {
            if (playerRole !== 'player2') return;
            
            currentProposal = data.value;
            player2DecisionControls.classList.remove('hidden');
            
            // Show proposal to player 2
            const player1Share = prizeValue - currentProposal;
            const player2Share = currentProposal;
            proposalDisplay.innerHTML = "Opponent offers you: " + player2Share + " points (keeping " + player1Share + " points)";
        }

        // Accept button handler
        acceptButton.addEventListener('click', () => {
            if (playerRole !== 'player2') return;
            
            // Send acceptance decision
            conn.send({
                type: 'decision',
                accepted: true
            });
            
            // Calculate payoffs
            const player1Share = prizeValue - currentProposal;
            const player2Share = currentProposal;
            
            // Update and display payoffs
            player1payoff = player1Share;
            player2payoff = player2Share;
            
            // Update UI
            handleAcceptedProposal(player1Share, player2Share);
            
            // Disable decision buttons
            acceptButton.disabled = true;
            rejectButton.disabled = true;
            player2DecisionControls.classList.add('hidden');
            nextRoundControls.classList.remove('hidden');
        });

        // Reject button handler
        rejectButton.addEventListener('click', () => {
            if (playerRole !== 'player2') return;
            
            // Send rejection decision
            conn.send({
                type: 'decision',
                accepted: false
            });
            
            // Determine war outcome
            let warResult = '';
            
            if (player1Capability > player2Capability) {
                // Player 1 wins
                player1payoff = prizeValue - costOfWar;
                player2payoff = -costOfWar;
                warResult = "War! You lost. Opponent gets " + (prizeValue - costOfWar) + " points. You lose " + costOfWar + " points.";
            } else {
                // Player 2 wins (including ties)
                player1payoff = -costOfWar;
                player2payoff = prizeValue - costOfWar;
                warResult = "War! You won! You get " + (prizeValue - costOfWar) + " points. Opponent loses " + costOfWar + " points.";
            }
            
            // Update UI
            handleRejectedProposal(warResult);
            
            // Disable decision buttons
            acceptButton.disabled = true;
            rejectButton.disabled = true;
            player2DecisionControls.classList.add('hidden');
            nextRoundControls.classList.remove('hidden');
        });

        // Handle accepted proposal (for Player 1)
        function handleAcceptedProposal(player1Share, player2Share) {
            outcome = 'Peaceful bargain';
            
            if (playerRole === 'player1') {
                resultSection.innerHTML = "Your opponent accepted your proposal.";
                opponentDecision.textContent = "Peaceful agreement reached!";
                opponentDecision.classList.remove('hidden');
                opponentDecision.style.backgroundColor = '#d4edda';
                
                payoffContainer.innerHTML = "<p>You receive: " + player1Share + " points</p>" +
                                          "<p>Opponent receives: " + player2Share + " points</p>";
            } else {
                resultSection.innerHTML = "You accepted the proposal.";
                payoffContainer.innerHTML = "<p>You receive: " + player2Share + " points</p>" +
                                          "<p>Opponent receives: " + player1Share + " points</p>";
            }
            
            // Register game data
            registerGameData();
        }

        // Handle rejected proposal (war outcome)
        function handleRejectedProposal(warResult) {
            outcome = 'War';
            
            if (playerRole === 'player1') {
                opponentDecision.text

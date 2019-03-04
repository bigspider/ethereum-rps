pragma solidity >=0.4.21 <0.6.0;

contract RPS {
    uint constant PRICE = 0.1 ether;
    uint constant BOND = 0.01 ether;
    uint constant DEADLINE = 1 minutes; // Probably use a longer deadline in real life!

    // Lose is a special value for failure to follow the protocol
    enum Choice { Rock, Paper, Scissors, Lose }

    enum Phase { Init, Commit, Reveal }

    Phase public phase = Phase.Init;

    address payable[] public players; // dynamic array, game starts when length == 2

    bool[2] public committed;
    bytes32[2] public commitments;

    bool[2] public revealed;
    Choice[2] public choices;

    uint public curGame = 1; // Incremented every time

    uint public timeoutStartTime; // Starting time of the last "meaningful" event, for timeouts.

    event PhaseChange(Phase newPhase);
    event PlayerRegistered(address payable playerAddr);
    event PlayerCommitted(uint8 player);
    event PlayerRevealed(uint8 player, Choice choice);
    event GameOver(uint gameNumber, address payable[] players, Choice[2] choices, int8 winner, string reason);

    // Only allow when the contract is in a certain phase
    modifier onlyInPhase(Phase _phase) {
        require(phase == _phase, "This function cannot be called in this phase");
        _;
    }

    // Only allow registered player(s)
    modifier onlyPlayers() {
        require(
            (players.length >= 1 && msg.sender == players[0]) || (players.length == 2 && msg.sender == players[1]),
            "Only players can do this!");
        _;
    }

    // This modifier requires a certain
    // fee being associated with a function call.
    // If the caller sent too much, he or she is
    // refunded, but only after the function body.
    // This was dangerous before Solidity version 0.4.0,
    // where it was possible to skip the part after `_;`.
    // From https://solidity.readthedocs.io/en/v0.5.4/common-patterns.html
    modifier costs(uint _amount) {
        require(
            msg.value >= _amount,
            "Not enough Ether provided."
        );
        _;
        if (msg.value > _amount)
            msg.sender.transfer(msg.value - _amount);
    }



    //Getters for convenience
    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
    function getCommitted() public view returns (bool[2] memory) {
        return committed;
    }
    function getCommitments() public view returns (bytes32[2] memory) {
        return commitments;
    }
    function getRevealed() public view returns (bool[2] memory) {
        return revealed;
    }
    function getChoices() public view returns (Choice[2] memory) {
        return choices;
    }    


    // Implements the logic of the game. Returns -1 if draw, or the index of the winner (0 or 1) otherwise.
    function getWinner(Choice choice0, Choice choice1) internal pure returns (int8) {
        if (choice0 == choice1) {
            return -1;
        }

        // Handle first cases of failure to follow the protocol
        if (choice0 == Choice.Lose) {
            return 1;
        } else if (choice1 == Choice.Lose) {
            return 0;
        } else {
            // Both player followed the protocol
            // Rock := 0; Paper := 1; Scissors := 2
            // a loses to b if (a + 1) % 3 == b.
            if ((uint8(choice0) + 1) % 3 == uint8(choice1)) {
                return 1;
            } else {
                return 0;
            }
        }
    }


    // Starts the timeout (for abort or forfeits)
    function startClock() internal {
        timeoutStartTime = now;
    }

    function changePhase(Phase newPhase) internal {
        phase = newPhase;
        emit PhaseChange(newPhase);
    }

    // Returns the index of the current player; reverts if sender is not a player
    function playerNumber() internal view returns (uint8) {
        for (uint8 i = 0; i < players.length; i++) {
            if (players[i] == msg.sender) {
                return i;
            }
        }

        revert();
    }

    // Reset contract, always call when game ends
    function cleanup() internal {
        delete players;
        delete committed;
        delete commitments;
        delete revealed;
        delete choices;
        delete timeoutStartTime;
        changePhase(Phase.Init);
        curGame++;
    }

    // Allows to pull out after a long enough timeout.
    // The price is refunded to each participant, but the caller gets all the bonds.
    function abort() public onlyPlayers {
        require(now >= timeoutStartTime + DEADLINE);

        uint8 player = playerNumber();

        require(
            (players.length == 1) || // No other player joined the game 
            (phase == Phase.Commit && committed[player]) // The other player did not play
        );

        // Temporary copy
        address payable[2] memory playersCopy = [players[0], players[1]];

        cleanup(); // Cleanup before payouts (prevents reentrancy)

        // Using send for payouts to prevent unwanted reverts
        for (uint i = 0; i < players.length; i++) {
            playersCopy[i].send(PRICE);
        }

        //Pay all bonds to the caller
        msg.sender.send(BOND * players.length);

        emit GameOver(curGame, players, [Choice.Lose, Choice.Lose], int8(player), "abort");
    }

    /* INIT */
    function register() public payable costs(PRICE + BOND) onlyInPhase(Phase.Init) {
        // Make sure he is not playing against himself
        if (players.length == 1) {
            require(players[0] != msg.sender, "You are already registered, wait for a second player!");
        }

        players.push(msg.sender);

        emit PlayerRegistered(msg.sender);

        startClock();

        if (players.length == 2) {
            changePhase(Phase.Commit);
        }
    }

    /* COMMIT */
    function commit(bytes32 comm) public onlyInPhase(Phase.Commit) onlyPlayers {
        uint8 player = playerNumber();

        require(!committed[player], "You already made your choice.");

        committed[player] = true;
        commitments[player] = comm;

        emit PlayerCommitted(player);

        startClock();

        if (committed[0] && committed[1]) {
            changePhase(Phase.Reveal);
        }
    }


    /* REVEAL */

    function payoutAndCleanup() internal {
        int8 winner = getWinner(choices[0], choices[1]);

        emit GameOver(curGame, players, choices, winner, "end");

        // Temporary copy
        address payable[2] memory playersCopy = [players[0], players[1]];

        cleanup(); // Cleanup before issuing payouts

        // Payouts (using sent instead of transfer to prevent reverts)
        if (winner == -1) {
            // Draw
            playersCopy[0].send(PRICE + BOND);
            playersCopy[1].send(PRICE + BOND);
        } else {
            //Winner takes the prize; refund bond to loser.
            playersCopy[uint256(winner)].send(2*PRICE + BOND);
            playersCopy[1 - uint256(winner)].send(BOND);
        }
    }

    function reveal(Choice choice, bytes32 nonce) public onlyInPhase(Phase.Reveal) onlyPlayers {
        uint8 player = playerNumber();

        require(!revealed[player], "You already revealed your answer.");

        revealed[player] = true;
        
        // The commitment also includes the player's number, to prevent the second committing player to
        // copy the commitment of the first (thus guaranteeing a draw!).
        if (keccak256(abi.encodePacked(player, uint8(choice), nonce)) == commitments[player]) {
            choices[player] = choice;
            emit PlayerRevealed(player, choice);
        } else {
            choices[player] = Choice.Lose; //failed to open the commitment
            emit PlayerRevealed(player, Choice.Lose);
        }

        startClock();

        //If both players revealed,
        if (revealed[0] && revealed[1]) {
            payoutAndCleanup();
        }
    }

    //After long enough, a user can claim victory if other player did not reveal
    function winByForfeiture() public onlyInPhase(Phase.Reveal) onlyPlayers {
        require(now > timeoutStartTime + DEADLINE);

        uint8 player = playerNumber();

        require(revealed[player]);

        players[player].transfer(2*(PRICE + BOND));

        emit GameOver(curGame, players, [Choice.Lose, Choice.Lose], int8(player), "forfeit");

        cleanup();
   }
}

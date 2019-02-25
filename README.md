# Rock Paper Scissors

Lizard and Spock coming in a future version.

**WARNING**: This is a toy project. Do not use with real money.

## Registration

To register as players, users pay the price (0.10 ether) plus a small bond (0.01) ether. The bond is used to incentivize cooperation.

## Contract phases

The contract can be in one of three phases: 

- Init: Users can register to the contract as players, by paying the price and a small bond. When two users are registered, contract moves to Commit phase. After a deadline, a user can decide to abort if no other user joins.
- Commit: Users can send a commitment to their choice. When two users committed, the contract moves to Reveal phase. A user who committed can abort the game (and earn the opponents bond) if the opponent does not participates; in this case, the price is refunded to both players.
- Reveal: Users can open their commitment. One both users opened their commitment, the contract adjudicates the game and pays the prize (twice the price) to the winner, while bonds are refunded. If a user fails to open his commitment within a deadline, the opponent can adjudicate the game and win the prize (and all the bonds) by forfeiture.

## Incentives

Thanks to the bond, the non-cooperative behaviour is always punished by compensating the opponent, regardless of the result of the game.

# Limitations

As a toy example, there are some limitations that would have to be addressed in a real-world dapp:

- The contract can only handle one game at the time. Easy to generalize to many simultaneous games.
- While a player might join the game thinking that he is the first player, another user might concurrently send a transaction and become the first player, which might not be what the first user had in mind (not a big deal).
- No attention given to a decent UX!

# Running it

Install npm, truffle, ganache and MetaMask. 

## Step 1. Clone the project
`git clone https://github.com/bigspider/ethereum-rps`

## Step 2. Install dependencies
```
$ cd ethereum-rps
$ npm install
```
## Step 3. Start Ganache
Start ganache by your favorite method.

## Step 4. Deploy Smart Contract
`$ truffle migrate --reset`

## Step 5. Configure Metamask
Connect metamask to the local blockchain (Localhost 8545)

## Step 6. Run Demo UX
`$ npm run start`

The dapp will be served at http://localhost:3000
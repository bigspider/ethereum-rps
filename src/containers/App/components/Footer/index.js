import React from 'react';
import BottomNavigation from 'components/BottomNavigation';
import RPSContext from 'contexts/RPSContext';
import { styles } from './styles.scss';


function getGameSummary(lastGame) {
  console.log(lastGame);
  const [gameNumber, players, choices, winner, reason] = lastGame;

  const intToMove = ["Rock", "Paper", "Scissors", "Lose"]

  if (reason == "end") {
    return `Game #${gameNumber}: ${players[0]}: ${intToMove[choices[0]]}; ${players[1]}: ${intToMove[choices[1]]}. Result: ${ winner == -1 ? "Draw" : "Player " + (winner+1) + " won"}.`;
  } else if (reason == "abort") {
    return `Game #${gameNumber}: Aborted by ${players[winner]}`;
  } else if (reason == "forfeit") {
    return `Game #${gameNumber}: ${players[winner]} won because ${players[1-winner]} forfeited.`;
  }
}

const Footer = () => (
  <RPSContext.Consumer>
    { ({ready, lastGame}) => (
      <div className={styles}>
        <BottomNavigation>
          <p className="lastgame">
            { ready && !!lastGame && (
              getGameSummary(lastGame)
            )}
          </p>
        </BottomNavigation>  
      </div>
    )}
  </RPSContext.Consumer>
);

export default Footer;

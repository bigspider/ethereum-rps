import React from 'react'
import RPSContext from '../../contexts/RPSContext';

import Button from '@material-ui/core/Button';

import { styles } from './styles.scss';

function getCurrentTimestamp() {
  return Math.floor((new Date()).getTime()/1000);
}


class HomeView extends React.Component {
  state = {
    currentTimestamp: getCurrentTimestamp() 
  };

  componentDidMount() {
    this.updateTimestampInterval = setInterval(() => {
      this.setState({ currentTimestamp: getCurrentTimestamp() })
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.updateTimestampInterval);
  }

  render() {
    const currentTimestamp = this.state.currentTimestamp;
    return (
      <RPSContext.Consumer>
      { ({
          ready, account,
          phase, players, committed, commitments, revealed, choices, timeoutStartTime,
          onStartGame, onJoinGame, onMakeMove, onReveal, onAbort, onClaimVictory
        }) =>
        {
          if (!ready) {
            return <p>Loading...</p>;
          }

          if (!account) {
            return <p>Please login to MetaMask.</p>;
          }
          
          const playing = players.includes(account); // is the current user playing
          const playerNumber = players.indexOf(account); //current player number (0, or 1), or -1 if not playing

          const isTimeout = currentTimestamp > timeoutStartTime + 60;
          const canAbort = playing && isTimeout && (phase === 0 || (phase === 1 && committed[playerNumber]));
          const canWinByForfeiture = playing && isTimeout && phase === 2 && revealed[playerNumber];

          return (
            <div className={styles}>
              <p>Contract in phase {phase}</p>

              { playerNumber === -1 ? (
                <p>You are not registered for this game.</p>
              ) : (
                <p>You are registered for the game as player #{playerNumber + 1}</p> 
              )}
  
              {/* PHASE 0: INIT */}

              { phase === 0 && players.length == 0 && (
                //No players yet
                <div>
                  <p>Do you want to be the first player?</p>
                  <Button variant="contained" color="primary" onClick={onStartGame}>
                    Start game
                  </Button>
                </div>
              )}

              { phase === 0 && players.length == 1 && !playing && (
                //There is already on player, but not the current user
                <div>
                  <p>{players[0]} is waiting for an opponent!</p>
                  <Button variant="contained" color="primary" onClick={onJoinGame}>
                    Accept challenge
                  </Button>
                </div>
              )}

              { phase === 0 && players.length == 1 && playing && (
                //Current user is already registered as the first player
                <p>Who will your opponent be?</p>
              )}

              {/* PHASE 1: COMMIT */}

              { phase === 1 && [0, 1].map( idx => (
                <div key={idx}>
                  { idx == playerNumber ? (
                    //Current player

                    committed[idx] ? (
                      <p>You already made your move. Please wait for your opponent.</p>
                    ) : (
                      <React.Fragment>
                        <p>Make your move!</p>
                        <div>
                          <Button variant="contained" onClick={() => onMakeMove(0)}>
                            Rock
                          </Button>
                          <Button variant="contained" onClick={() => onMakeMove(1)}>
                            Paper
                          </Button>
                          <Button variant="contained" onClick={() => onMakeMove(2)}>
                            Scissors
                          </Button>
                        </div>
                      </React.Fragment>
                    )
                  ) : (
                    //Other player
                    committed[idx] ? (
                      <p>Player {idx+1} made his move.</p>
                    ) : (
                      <p>Player {idx+1} did not make his move.</p>
                    )
                  )}
                </div>
              ))}
              

              {/* PHASE 2: REVEAL */}

              { phase === 2 && [0, 1].map( idx => (
                <div key={idx}>
                  { idx == playerNumber ? (
                    //Current player

                    revealed[idx] ? (
                      <p>You already revealed your move.</p>
                    ) : (
                      <React.Fragment>
                        <p>You did not reveal your move, yet.</p>
                        <Button variant="contained" color="primary" onClick={onReveal}>
                          Reveal!
                        </Button>
                      </React.Fragment>
                    )
                  ) : (
                    //Other player
                    revealed[idx] ? (
                      <p>Player {idx+1}'s choice was: {["Rock", "Paper", "Scissors"][choices[idx]]}</p>
                    ) : (
                      <p>Player {idx+1} did not reveal the choice yet.</p>
                    )
                  )}
                </div>
              ))}

              { canAbort && (
                <div>
                  <p>Timeout. You can abort the game.</p>
                  <Button variant="contained" color="secondary" onClick={onAbort}>
                    Abort game
                  </Button>                
                </div>
              )}

              { canWinByForfeiture && (
                <div>
                  <p>Your opponent failed to reveal the choice in time. You can claim victory!</p>
                  <Button variant="contained" color="secondary" onClick={onClaimVictory}>
                    Claim victory
                  </Button>                
                </div>
              )}

            </div>
          )
        }
      }
      </RPSContext.Consumer>
    );
  }
}

export default HomeView;

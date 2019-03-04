import React from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { HashRouter, Route, Redirect, Switch } from 'react-router-dom';
import theme from 'configs/theme/config-theme';
import HomeView from 'containers/HomeView';
import Header from './components/Header';
import Footer from './components/Footer';

import RPSContext from '../../contexts/RPSContext';

import Web3 from 'web3';
import { soliditySha3, randomHex, toWei } from 'web3-utils';

import TruffleContract from 'truffle-contract';
import RPS from '../../../build/contracts/RPS.json';

import './styles.scss'; // global styles

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      account: null, //current MetaMask account owner

      //Contract state
      curGame: null,
      phase: null,
      players: [],
      committed: [],
      commitments: [],
      revealed: [],
      choices: [],
      timeoutStartTime: null,

      lastGame: null
    };


    if (typeof window.web3 != 'undefined') {
      this.web3Provider = window.web3.currentProvider;
    } else {
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    this.web3 = new Web3(this.web3Provider);
    this.rps = TruffleContract(RPS);
    this.rps.setProvider(this.web3Provider);
  }

  componentDidMount() {
    let account = this.web3.eth.accounts[0];
    this.accountInterval = setInterval(function() {
      if (this.web3.eth.accounts[0] !== account) {
        account = this.web3.eth.accounts[0];
        this.reloadState(true);
      }
    }, 100);

    this.rps.deployed().then(rpsInstance => {
      this.rpsInstance = rpsInstance;

      //Make sure we are notified whens the phase changes
      rpsInstance.PhaseChange().watch((error, event) => {
        const phase = event.args.newPhase.toNumber();

        this.setState({ phase });

        this.reloadState();
      });


      //Make sure we are notified whens the phase changes
      rpsInstance.GameOver().watch((error, event) => {
        const gameNumber = event.args.gameNumber.toNumber();
        const players = event.args.players;
        const choices = event.args.choices.map(c => c.toNumber())
        const winner = event.args.winner.toNumber();
        const reason = event.args.reason;

        this.setState({
          lastGame: [gameNumber, players, choices, winner, reason]
        });

        this.reloadState();
      });

      rpsInstance.PlayerRegistered().watch(this.reloadState);
      rpsInstance.PlayerCommitted().watch(this.reloadState);
      rpsInstance.PlayerRevealed().watch(this.reloadState);
    });

    this.reloadState(true);
  }

  componentWillUnmount() {
    clearInterval(this.accountInterval);
  }

  computeChoiceCommitment = (playerNumber, choice, nonce) => {
    return soliditySha3({
      type: 'uint8',
      value: playerNumber
    },
    {
      type: 'uint8',
      value: choice
    },
    {
      type: 'bytes32',
      value: nonce
    });
  };

  reloadState = (markNotReadyWhileReloading = false) => {
    if (markNotReadyWhileReloading) {
      this.setState({ ready: false });
    }
    this.web3.eth.getCoinbase((err, account) => {
      this.setState({ account });
      this.rps.deployed().then(rpsInstance => {
        this.rpsInstance = rpsInstance;

        Promise.all([
          rpsInstance.phase().then(p => p.toNumber()),
          rpsInstance.getPlayers(),
          rpsInstance.getCommitted(),
          rpsInstance.getCommitments(),
          rpsInstance.getRevealed(),
          rpsInstance.getChoices(),
          rpsInstance.timeoutStartTime().then(t => t.toNumber()),
          rpsInstance.curGame().then(g => g.toNumber()),
        ])
        .then(([phase, players, committed, commitments, revealed, choices, timeoutStartTime, curGame]) => {
          this.setState({
            phase, players, committed, commitments, revealed, choices, timeoutStartTime,
            curGame,
            ready: true
          });
        });
      });
    });    
  };

  onStartGame = () => {
    this.rpsInstance.register({ from: this.state.account, value: toWei("0.11", "ether") }).then(() => {
      this.reloadState();
    });
  };

  onJoinGame = () => this.onStartGame();

  onMakeMove = (choice) => {
    const nonce = soliditySha3({ type: "bytes32", value: randomHex(32) }); //TODO: better way of generating the nonce?
    const playerNumber = this.state.players.indexOf(this.state.account);

    const comm = this.computeChoiceCommitment(playerNumber, choice, nonce);

    localStorage.setItem(`choice${playerNumber}`, choice);
    localStorage.setItem(`nonce${playerNumber}`, nonce);

    this.rpsInstance.commit(comm, { from: this.state.account }).then(() => {
      this.reloadState();
    });
  };

  onAbort = () => {
    this.rpsInstance.abort({ from: this.state.account }).then(() => {
      this.reloadState();
    });
  };

  onClaimVictory = () => {
    this.rpsInstance.winByForfeiture({ from: this.state.account }).then(() => {
      this.reloadState();
    });
  };

  onReveal = () => {
    const playerNumber = this.state.players.indexOf(this.state.account);
    const choice = parseInt(localStorage.getItem(`choice${playerNumber}`));
    const nonce = localStorage.getItem(`nonce${playerNumber}`, nonce);

    this.rpsInstance.reveal(choice, nonce, { from: this.state.account }).then(() => {
      this.reloadState();
    });
  };

  render() {
    const context = {
      ...this.state,
      onStartGame: this.onStartGame,
      onJoinGame: this.onJoinGame,
      onMakeMove: this.onMakeMove,
      onReveal: this.onReveal,
      onAbort: this.onAbort,
      onClaimVictory: this.onClaimVictory
    };

    return (
      <MuiThemeProvider theme={theme}>
        <RPSContext.Provider value={context}>
          <HashRouter>
            <div>
              <Header />
              <Footer />
              <div className="app-shell">
                <Switch>
                  <Route path="/home" component={HomeView} />
                  <Redirect from="/" to="/home" />
                </Switch>
              </div>
            </div>
          </HashRouter>
        </RPSContext.Provider>
      </MuiThemeProvider>
    );
  }
}

export default App;

import React from 'react';
import PropTypes from 'prop-types';
import { AppBar as MuiAppBar } from '@material-ui/core';
import { styles } from './styles.scss';

const AppBar = ({ children }) => (
  <div className={styles}>
    <MuiAppBar position="static" className="app-bar">
      {children}
    </MuiAppBar>
  </div>
);

AppBar.propTypes = {
  children: PropTypes.node
};

AppBar.defaultProps = {
  children: null
};

export default AppBar;

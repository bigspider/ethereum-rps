import React from 'react';
import PropTypes from 'prop-types';
import { Paper } from '@material-ui/core';
import { styles } from './styles.scss';

const BottomNavigation = ({ children, transparent }) => {
  const isTransparent = transparent ? 'transparent' : 'not-transparent'

  return (
    <div className={styles}>
      <Paper>
        <div className={`bottom-navigation ${isTransparent}`}>
          {children}
        </div>
      </Paper>
    </div>
  )
};

BottomNavigation.propTypes = {
  children: PropTypes.node.isRequired,
  transparent: PropTypes.bool
};

BottomNavigation.defaultProps = {
  transparent: false
};

export default BottomNavigation;

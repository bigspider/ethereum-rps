import React  from 'react';
import AppBar from 'components/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { appConfig } from 'configs/config-main';
import { styles } from './styles.scss';

const Header = () => (
  <div className={styles}>
    <AppBar>
      <Toolbar>
        <Typography variant="title" color="inherit">
          {appConfig.name}
        </Typography>
      </Toolbar>
    </AppBar>
  </div>
);
  
export default Header;

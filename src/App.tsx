import React, { useRef, useState } from 'react';

import clsx from 'clsx';
import { Drawer, AppBar, Toolbar, IconButton, CssBaseline, Container } from '@material-ui/core';

import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import OpenDrawerIcon from '@material-ui/icons/ExpandLess';
import CloseDrawerIcon from '@material-ui/icons/ExpandMore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

import RegionEditorContainer from './components/RegionEditorContainer';
import { ImageList, Callback } from './components/ImageList';

const drawerHeight = 210;
const appBarHeight = 64;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'block',
      height: `100vh`,
    },
    main: {
      height: `calc(100% - ${appBarHeight}px)`,
      width: `100%`,
    },
    appBar: {
      top: 'auto',
      bottom: 0,
    },
    grow: {
      flexGrow: 1,
    },
    appBarShift: {
      marginBottom: `calc(${drawerHeight}px)`,
      transition: theme.transitions.create(['margin', 'height'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
    },
    drawerPaper: {
      height: drawerHeight,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginBottom: -drawerHeight,
    },
    contentShift: {
      transition: theme.transitions.create(['margin', 'height'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginBottom: `calc(${drawerHeight}px)`,
    },
  }),
);


function App() {
  const [imageListShown, setImageListShown] = useState(true);
  const [selectedFile, setFile] = useState<File>();

  const appBar = useRef<HTMLElement>(null);

  const classes = useStyles();
  const theme = useTheme();

  const callback = new (class implements Callback {
    onFileSelected(file: File) {
      setFile(file);
    }
  });
  const toggleDrawer = () => {
    setImageListShown(!imageListShown);
  }

  return (
    <div className="App">
      <CssBaseline />

      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />

      <div className={classes.root}>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="bottom"
          open={imageListShown}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <ImageList callback={callback} />
        </Drawer>

        <main className={classes.main}>
          <RegionEditorContainer
            selectedFile={selectedFile}
            className={clsx(classes.content, {
              [classes.contentShift]: imageListShown,
            })}
          />
        </main>
      </div>

      <AppBar ref={appBar} position="fixed" color="primary" className={clsx(classes.appBar, {
        [classes.appBarShift]: imageListShown,
      })}>
        <Toolbar>
          <IconButton onClick={toggleDrawer} edge="start" color="inherit" aria-label="open drawer">
            {!imageListShown ? <OpenDrawerIcon /> : <CloseDrawerIcon />}
          </IconButton>

          <div className={classes.grow} />
          <IconButton color="inherit">
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton edge="end" color="inherit">
            <NavigateNextIcon />
          </IconButton>

        </Toolbar>
      </AppBar>
    </div >
  );
}

export default App;

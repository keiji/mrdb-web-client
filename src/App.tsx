import React, { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { Drawer, IconButton, CssBaseline, Paper } from '@material-ui/core';

import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import OpenDrawerIcon from '@material-ui/icons/ExpandLess';
import CloseDrawerIcon from '@material-ui/icons/ExpandMore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

import RegionEditorContainer from './components/RegionEditorContainer';
import { ImageList, Callback } from './components/ImageList';
import { nextTick } from 'process';

const drawerHeight = 210;
const drawerHeaderHeight = 64;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'block',
      height: `100vh`,
    },
    main: {
      height: `calc(100% - ${drawerHeaderHeight}px)`,
      width: `100%`,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(1, 1),
      justifyContent: 'flex-end',
      position: `fixed`,
      ...theme.mixins.toolbar,
      top: 'auto',
      bottom: `0px`,
      width: `100%`,
      backgroundColor: theme.palette.background.paper,
    },
    grow: {
      flexGrow: 1,
    },
    drawerHeaderShift: {
      marginBottom: `calc(${drawerHeight}px)`,
      transition: theme.transitions.create(['margin', 'height'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawer: {
    },
    drawerPaper: {
      height: drawerHeight,
    },
    drawerHeaderPaper: {
      paddingLeft: `16dp`,
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
  const [fileList, setFileList] = useState<Array<File>>();
  const [selectedFile, setFile] = useState<File>();

  const rootElement = useRef<HTMLDivElement>(null);

  const classes = useStyles();

  const callback = new (class implements Callback {
    onFileListUpdated(fileList: File[]): void {
      setFileList(fileList);
    }

    onFileSelected(file: File) {
      setFile(file);
    }
  });

  const toggleDrawer = () => {
    setImageListShown(!imageListShown);
  }

  const prevFile = () => {
    if (!selectedFile) {
      return
    }
    if (!fileList) {
      return
    }
    const currentIndex = fileList.indexOf(selectedFile)
    if (currentIndex < 0) {
      return;
    }

    const index = currentIndex - 1;
    if (index >= 0) {
      setFile(fileList[index]);
    }
  }

  const nextFile = () => {
    if (!selectedFile) {
      return
    }
    if (!fileList) {
      return
    }
    const currentIndex = fileList.indexOf(selectedFile)
    if (currentIndex < 0) {
      return;
    }

    const index = currentIndex + 1;
    if (index < fileList.length) {
      setFile(fileList[index]);
    }
  }

  const onKeyDownListener = (event) => {
    if (event.key == ' ') {
      event.preventDefault();
      toggleDrawer();
    }
  }

  return (
    <div className="App" ref={rootElement} onKeyDown={onKeyDownListener} tabIndex={-1}>
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

      <Paper className={clsx(classes.drawerHeaderPaper, classes.drawerHeader, {
        [classes.drawerHeaderShift]: imageListShown,
      })}>
        <IconButton onClick={toggleDrawer} color="inherit" aria-label="open drawer">
          {!imageListShown ? <OpenDrawerIcon /> : <CloseDrawerIcon />}
        </IconButton>

        <div className={classes.grow} />

        <IconButton color="inherit" onClick={prevFile}>
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton color="inherit" onClick={nextFile}>
          <NavigateNextIcon />
        </IconButton>
      </Paper>
    </div>
  );
}

export default App;

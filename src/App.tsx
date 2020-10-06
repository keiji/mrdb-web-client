import React, { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { Drawer, IconButton, CssBaseline, Paper, Box, Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions, Button } from '@material-ui/core';

import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';
import OpenDrawerIcon from '@material-ui/icons/ExpandLess';
import CloseDrawerIcon from '@material-ui/icons/ExpandMore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import RegionEditorContainer from './components/RegionEditorContainer';
import { ImageList, Callback } from './components/ImageList';

// https://techracho.bpsinc.jp/hachi8833/2019_10_09/80851
const KEY_AGREEMENT = 'agreement';
const LATEST_AGREEMENT_DATE = '20201006';

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

  const agreementDate = localStorage.getItem(KEY_AGREEMENT);
  const [dialogShown, setDialogShown] = useState(agreementDate ? !(agreementDate === LATEST_AGREEMENT_DATE) : true);

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

  const showDialog = () => {
    const handleAgree = () => {
      localStorage.setItem(KEY_AGREEMENT, LATEST_AGREEMENT_DATE);
      setDialogShown(false);
    }
    const handleDisagree = () => {
      window.location.href = `https://google.com`;
    }

    return (
      <Dialog
        open={dialogShown}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Agreement</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Image files will be uploaded to the server for generate image-ids by "imagehash" algorithm.
            And image files will be saved and used to improve services.<br />
            ROI(Region of Interest) data and image-ids will be uploaded, stored, and redistribute for all users.<br />
            <br />
            <strong>WE DO NOT REDISTRIBUTE YOUR IMAGE FILES TO THE OTHERS.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisagree} color="primary">
            Disagree
          </Button>
          <Button onClick={handleAgree} color="primary" autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  const showButtons = () => {
    return (
      <Box>
        <IconButton color="inherit" onClick={prevFile}>
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton color="inherit" onClick={nextFile}>
          <NavigateNextIcon />
        </IconButton>
      </Box>
    );
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
          <ImageList
            selectedFile={selectedFile}
            callback={callback} />
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

        {showButtons()}
      </Paper>

      {showDialog()}

    </div>
  );
}

export default App;

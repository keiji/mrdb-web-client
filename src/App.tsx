import React, { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { Drawer, IconButton, CssBaseline, Paper, Box, Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions, Button, Typography, Tooltip } from '@material-ui/core';

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import OpenDrawerIcon from '@material-ui/icons/ExpandLess';
import CloseDrawerIcon from '@material-ui/icons/ExpandMore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import { RegionEditorContainer, Callback as RegionEditorContainerCallback } from './components/RegionEditorContainer';
import { ImageList, Callback } from './components/ImageList';

import * as apis from "./api/crdbApi";

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
      textAlign: `center`,
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
  const [onlineMode, setOnlineMode] = useState(true);

  const [imageListShown, setImageListShown] = useState(true);
  const [fileList, setFileList] = useState<Array<File>>();

  const [selectedFile, setFile] = useState<File>();

  const agreementDate = localStorage.getItem(KEY_AGREEMENT);
  const [agreementDialogShown, showAgreementDialog] = useState(agreementDate ? !(agreementDate === LATEST_AGREEMENT_DATE) : true);

  const rootElement = useRef<HTMLDivElement>(null);

  const classes = useStyles();

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

  const callback = new (class implements Callback {
    onFileListUpdated(fileList: File[]): void {
      setFileList(fileList);
    }

    onFileSelected(file: File) {
      setFile(file);
    }
  });

  const regionEditorContainerCallback = new (class implements RegionEditorContainerCallback {
    onTurnOnlineRequested(): void {
      showAgreementDialog(true);
    }
  });

  const toggleDrawer = () => {
    setImageListShown(!imageListShown);
  }

  const getHashList = async (fileList: Array<File>) => {
    const result: { [key: string]: {} } = {};

    for (const f of fileList) {
      const imageIds = await apis.fetchHash(f);
      result[f.name] = {
        "image_ids": imageIds,
        "url": apis.fetchPageRegionsUrl(imageIds)
      };
    }
    return result;
  }

  const exportRegions = async () => {
    if (!fileList) {
      return;
    }

    const hashList = await getHashList(fileList)

    const blob = new Blob([JSON.stringify(hashList, null, '  ')], { type: 'application\/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.download = 'export.json';
    a.href = url;
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  const onKeyDownListener = (event) => {
    if (event.key == ' ') {
      event.preventDefault();
      toggleDrawer();
    }
  }

  const agreementDialog = () => {
    const handleAgree = () => {
      setOnlineMode(true);
        localStorage.setItem(KEY_AGREEMENT, LATEST_AGREEMENT_DATE);
      showAgreementDialog(false);
      }
    const handleDisagree = () => {
      setOnlineMode(false);
      showAgreementDialog(false);
    }

    return (
      <Dialog
        open={agreementDialogShown}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Online mode(Agreement)</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            In online mode, image files will be uploaded to our server for generate image-ids by "imagehash" algorithm.
            And image files will be stored for improving our services.<br />
            ROI(Region of Interest) data and image-ids will be uploaded, stored, and redistribute for all users.<br />
            <br />
            We <strong>DO NOT</strong> redistribute your image files.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisagree} color="primary">
            Decline (Continue offline)
          </Button>
          <Button onClick={handleAgree} color="primary">
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const showExportButton = () => {
    if (!onlineMode) {
      return (<span></span>);
    }

    return (
      <Tooltip title="Export all image-IDs" aria-label="export-image-ids">
        <IconButton color="inherit" onClick={exportRegions}>
          <SaveAltIcon />
        </IconButton>
      </Tooltip>
    );
  }
  const showButtons = () => {
    if (!fileList || fileList.length == 0) {
      return (<Box></Box>);
    }
    return (
      <Box>
        <Tooltip title="Prev file" aria-label="prev-file">
          <IconButton color="inherit" onClick={prevFile}>
            <NavigateBeforeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Next file" aria-label="next-file">
          <IconButton color="inherit" onClick={nextFile}>
            <NavigateNextIcon />
          </IconButton>
        </Tooltip>

        {showExportButton()}
      </Box>
    );
  }

  const toggleDrawerTitle = () => {
    return imageListShown ? "Close (Space)" : "Open (Space)";
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
            onlineMode={onlineMode}
            callback={regionEditorContainerCallback}
            className={clsx(classes.content, {
              [classes.contentShift]: imageListShown,
            })}
          />
        </main>
      </div>

      <Paper elevation={1} className={clsx(classes.drawerHeaderPaper, classes.drawerHeader, {
        [classes.drawerHeaderShift]: imageListShown,
      })}>
        <Tooltip title={toggleDrawerTitle()} aria-label="toggle-drawer">
          <IconButton onClick={toggleDrawer} color="inherit" aria-label="open drawer">
            {!imageListShown ? <OpenDrawerIcon /> : <CloseDrawerIcon />}
          </IconButton>
        </Tooltip>

        <div className={classes.grow}>
          <Typography variant='caption'>Copyright 2020 Keiji ARIYAMA (C-LIS CO., LTD.)</Typography>
        </div>

        {showButtons()}
      </Paper>

      {agreementDialog()}

    </div>
  );
}

export default App;

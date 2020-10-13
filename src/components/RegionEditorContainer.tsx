import React, { useEffect, useState } from 'react';
import { RegionEditor } from './RegionEditor';
import RegionList from './RegionList';

import { AppBar, Button, Container, createStyles, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, makeStyles, Snackbar, SnackbarOrigin, Theme, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { Callback as RegionEditorCallback, EditHistory } from '../RegionEditorController';
import { Callback as RegionListCallback } from './RegionList';
import { Callback as CategorySettingCallback } from './CategorySetting';

import { convertRegionsToPathRegions, Region } from '../Region';
import * as apis from "../api/crdbApi";
import { Category } from '../Category';
import { Label } from '../Label';

import SaveIcon from '@material-ui/icons/Save';
import UndoIcon from '@material-ui/icons/Undo';
import BackupIcon from '@material-ui/icons/Backup';
import CloudOffIcon from '@material-ui/icons/CloudOff';

import { v4 as uuidv4 } from 'uuid';

const APP_TITLE = "CRDB - Comic Region Database";
const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        width: `100%`,
        height: `100%`,
        backgroundColor: theme.palette.background.paper,
        display: `flex`,
    },
    grid: {
        top: `64px`,
        height: `calc(100% - 64px)`,
    },
    regionEditor: {
        height: `100%`,
        backgroundColor: theme.palette.background.paper,
        display: `flex`
    },
    regionList: {
        height: `100%`,
        backgroundColor: theme.palette.background.paper,
        display: `flex`
    },
    title: {
        flexGrow: 1,
    },
    menu: {
    },
}),
);

export interface State extends SnackbarOrigin {
    open: boolean;
}

export function RegionEditorContainer(props: any) {
    const classes = useStyles();

    const idempotencyKey = uuidv4();

    const [undoEvent, fireUndoEvent] = useState(0);

    const [editingFile, setEditingFile] = useState<File | null>(null);
    const [isDirty, setDirty] = useState(false);
    const [showSaveConfirmDialog, setShowSaveDialog] = useState(false);

    const [hashes, setHashes] = useState<{}>()

    const [categoryList, setCategoryList] = useState<Array<Category>>()
    const [selectedCategory, setSelectedCategory] = useState<Category>()

    const [labelList, setLabelList] = useState<Array<Label>>()

    const [regionList, setRegionList] = useState<Array<Region>>()
    const [historyList, setHistoryList] = useState<Array<EditHistory>>()

    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)

    const [snackbarText, setSnackbarText] = useState<string>("Hello")

    const [state, setState] = useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
    });
    const { vertical, horizontal, open } = state;

    const regionEditorCallback = new (class implements RegionEditorCallback {
        onSelectedRegion(selectedRegion: Region | null) {
            setSelectedRegion(selectedRegion)
        }
        onAddedRegion(addedRegion: Region, regionList: Array<Region>) {
            setRegionList([...regionList]);
        }
        onDeletedRegion(deletedRegion: Region, regionList: Array<Region>) {
            setRegionList([...regionList]);
        }
        onChangedLabel(changedRegion: Region, regionList: Array<Region>) {
            setRegionList([...regionList]);
        }
        onHistoryUpdated(historyList: Array<EditHistory>) {
            setHistoryList([...historyList]);
        }
        onRegionListUpdated(regionList: Array<Region>) {
            setRegionList([...regionList]);
        }
    })();

    const regionListCallback = new (class implements RegionListCallback {
        onChangeRegionList(regionList: Region[]): void {
            const newRegionList = [...regionList];
            setRegionList(newRegionList);
        }
        onCategoriesUpdated(categoryList: Category[]): void {
            const newCategoryList = [...categoryList];
            setCategoryList(newCategoryList);
        }
        onRegionSelected(region: Region): void {
            setSelectedRegion(region);
        }
        onSubmitRegionList(regionList: Region[]): void {
            submitRegions(regionList);
        }
    })();

    const categorySettingCallback = new (class implements CategorySettingCallback {
        onCategoriesUpdated(categoryList: Category[]): void {
            const newCategoryList = [...categoryList];
            setCategoryList(newCategoryList);
        }
        onCategorySelected(category: Category): void {
            setSelectedCategory(category);
        }
        onLabelsUpdated(labelList: Label[]): void {
            setLabelList(labelList);
        }
    })();

    const getRegions = async () => {
        if (!props.onlineMode) {
            return;
        }

        setRegionList(new Array<Region>());

        const h = await apis.fetchHash(props.selectedFile);
        setHashes(h);

        try {
            const result = await apis.fetchPageRegions(h);
            if (h === result.hashes) {
                setRegionList(result.regions);
            }
        } catch (error) {
        }
    }

    useEffect(() => {
        if (!props.selectedFile) {
            return;
        }

        if (isDirty) {
            setShowSaveDialog(true);
            return;
        }

        setEditingFile(props.selectedFile)
    }, [props.selectedFile]);

    useEffect(() => {
        if (!props.onlineMode) {
            return;
        }

        getRegions();
    }, [props.onlineMode]);

    useEffect(() => {
        if (!editingFile) {
            return;
        }

        getRegions();
    }, [editingFile]);

    useEffect(() => {
        if (!historyList) {
            return;
        }

        const dirty = historyList.length > 0;
        setDirty(dirty);

    }, [historyList]);

    const submitRegions = async (regions: Array<Region> | null | undefined) => {
        if (!hashes) {
            return;
        }
        if (!regions) {
            return;
        }
        await apis.submitPageRegions(idempotencyKey, hashes, regions);

        setSnackbarText("Save completed.");
        setState({ ...state, open: true });
        setDirty(false);
    };

    const saveRegions = async (regions: Array<Region> | null | undefined) => {
        if (!regions) {
            return;
        }

        const regionsObj = convertRegionsToPathRegions(regions);
        const jsonObj = {
            "file": props.selectedFile.name,
            "regions": regionsObj
        }

        if (hashes) {
            jsonObj["image_ids"] = {
                "dhash8": hashes["dhash8"],
                "dhash12": hashes["dhash12"],
                "dhash16": hashes["dhash16"],
            }
        }

        const blob = new Blob([JSON.stringify(jsonObj, null, '  ')], { type: 'application\/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.download = props.selectedFile.name + '.json';
        a.href = url;
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    };

    const title = () => {
        if (!props.selectedFile) {
            return APP_TITLE;
        }
        return props.selectedFile.name
    }

    const onSnackbarClose = () => {
        setState({ ...state, open: false });
    }

    const undo = () => {
        fireUndoEvent(Date.now());
    }

    const menu = () => {
        const showUndoMenu = () => {
            if (!historyList) {
                return (<span></span>);
            }
            if (historyList.length == 0) {
                return (<span></span>);
            }

            return (
                <Tooltip title="Undo (Ctrl + Z)" aria-label="undo">
                    <IconButton color="inherit" onClick={() => { undo(); }}>
                        <UndoIcon />
                    </IconButton>
                </Tooltip>
            );
        };

        const showServerMenu = () => {
            const turnOnline = () => {
                props.callback.onTurnOnlineRequested();
            }

            if (!props.onlineMode) {
                return (
                    <Tooltip title="Turn to online" aria-label="turn-online-on">
                        <IconButton color="inherit" onClick={turnOnline}>
                            <CloudOffIcon />
                        </IconButton>
                    </Tooltip>
                );
            }

            if (!isDirty) {
                return (<span></span>);
            }

            return (
                <Tooltip title="Save to server" aria-label="submit-to-server">
                    <IconButton color="inherit" onClick={() => { submitRegions(regionList); }}>
                        <BackupIcon />
                    </IconButton>
                </Tooltip>
            );
        };

        const showExportMenu = () => {
            if (!regionList || regionList.length == 0) {
                return (<span></span>);
            }

            return (
                <Tooltip title="Export region data" aria-label="export-regions">
                    <IconButton color="inherit" onClick={() => { saveRegions(regionList); }}>
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
            );
        }

        return (
            <div className={classes.menu}>
                {showUndoMenu()}
                {showServerMenu()}
                {showExportMenu()}
            </div>
        );
    }

    const showSaveDialog = () => {
        const handleSave = () => {
            if (props.onlineMode) {
                submitRegions(regionList);
            } else {
                saveRegions(regionList);
            }

            setRegionList(Array());
            setShowSaveDialog(false);
            setEditingFile(props.selectedFile);
        }

        const handleDiscard = () => {
            setRegionList(Array());

            setShowSaveDialog(false);
            setEditingFile(props.selectedFile);
        }

        const showSaveButton = () => {
            if (props.onlineMode) {
                return (
                    <DialogActions>
                        <Button onClick={handleDiscard} color="primary">
                            Discard
                        </Button>
                        <Button onClick={handleSave} color="primary" autoFocus>
                            Save
                        </Button>
                    </DialogActions>
                );
            } else {
                return (
                    <DialogActions>
                        <Button onClick={handleDiscard} color="primary">
                            Discard
                        </Button>
                        <Button onClick={handleSave} color="primary" autoFocus>
                            Save
                        </Button>
                    </DialogActions>
                );
            }
        }
        return (
            <Dialog
                open={showSaveConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Save changes?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Do you want to save changes before opening an other file?
              </DialogContentText>
                </DialogContent>

                {showSaveButton()}
            </Dialog>
        );
    }

    return (
        <React.Fragment>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        {title()}
                    </Typography>
                    {menu()}
                </Toolbar>
            </AppBar>

            <Snackbar
                open={open}
                onClose={onSnackbarClose}
                message={snackbarText}
                autoHideDuration={2000}
                anchorOrigin={{ vertical, horizontal }}
                key={vertical + horizontal}
            />
            <Grid container spacing={0} className={classes.grid}>
                <Grid item xs={8} className={classes.regionEditor}>
                    <RegionEditor file={editingFile}
                        selectedCategory={selectedCategory}
                        regionList={regionList}
                        selectedRegion={selectedRegion}
                        callback={regionEditorCallback}
                        undoEvent={undoEvent}
                    />
                </Grid>
                <Grid item xs={4} className={classes.regionList} >
                    <Container>
                        <RegionList
                            regionList={regionList}
                            selectedRegion={selectedRegion}
                            categoryList={categoryList}
                            selectedCategory={selectedCategory}
                            labelList={labelList}
                            callback={regionListCallback}
                            categorySettingCallback={categorySettingCallback}
                        />
                    </Container>
                </Grid>

            </Grid>

            {showSaveDialog()}

        </React.Fragment>
    );
}

export default RegionEditorContainer;

export interface Callback {
    onTurnOnlineRequested(): void
}
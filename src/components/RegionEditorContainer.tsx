import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react';
import { RegionList } from './RegionList';

import {
    AppBar, Button, Container, createStyles,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Grid, IconButton, makeStyles, Menu, MenuItem, Snackbar, SnackbarOrigin,
    Theme, Toolbar, Tooltip, Typography
} from '@material-ui/core';
import { Callback as RegionEditorCallback } from './RegionEditor/RegionEditorController';
import { Callback as RegionListCallback } from './RegionList';
import { Callback as CategorySettingCallback } from './CategorySetting';

import * as apis from "../api/crdbApi";
import { convertPointsToRegions, convertRegionsToPathRegions, Region } from '../entities/Region';
import { Label } from '../entities/Label';
import { Category } from '../entities/Category';
import { RegionEditor } from './RegionEditor/index';

import UndoIcon from '@material-ui/icons/Undo';
import BackupIcon from '@material-ui/icons/Backup';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import ImportExportIcon from '@material-ui/icons/ImportExport';

import { v4 as uuidv4 } from 'uuid';

export class EditHistory {
    selectedRegion: Region | null
    regionList: Array<Region>

    constructor(selectedRegion: Region | null, regionList: Array<Region>) {
        this.selectedRegion = selectedRegion;
        this.regionList = regionList;
    }
}

const APP_TITLE = "CRDB - Manga Region Database";
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

type Props = {
    onlineMode: boolean,
    selectedFile: File | null | undefined,
    callback: Callback,
    className: any
}

// https://stackoverflow.com/a/58439475
function useStateRef<T>(initialValue: T): [T, Dispatch<SetStateAction<T>>, MutableRefObject<T>] {
    const [value, setValue] = useState<T>(initialValue);

    const ref = useRef<T>(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return [value, setValue, ref];
}

export function RegionEditorContainer(props: Props) {
    const classes = useStyles();

    const idempotencyKey = useRef(uuidv4());

    const [editingFile, setEditingFile] = useState<File | null | undefined>(null);
    const [isDirty, setDirty] = useState(false);
    const [showSaveConfirmDialog, setShowSaveDialog] = useState(false);

    const [anchorImportExportMenu, setAnchorImportExportMenu] = useState<null | HTMLElement>(null);
    const importInput = useRef<null | HTMLInputElement>(null);

    const [hashes, setHashes] = useState<{}>()

    const [categoryList, setCategoryList] = useState<Array<Category>>()
    const [selectedCategory, setSelectedCategory] = useState<Category>()

    const [labelList, setLabelList] = useState<Array<Label>>()

    const [selectedRegionState, setSelectedRegion, selectedRegionRef] = useStateRef<Region | null>(null);
    const [regionListState, setRegionList, regionListRef] = useStateRef(new Array<Region>());
    const [historyListState, setHistoryList, historyListRef] = useStateRef(new Array<EditHistory>());

    const [snackbarText, setSnackbarText] = useState<string>("Hello")

    const [state, setState] = useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
    });
    const { vertical, horizontal, open } = state;

    const init = () => {
        setDirty(false);
        setHashes({});
        setRegionList(Array());
        setHistoryList(Array());
    }

    const regionEditorCallback = new (class implements RegionEditorCallback {
        onSelectedRegion(selectedRegion: Region | null) {
            setSelectedRegion(selectedRegion)
        }
        onAddedRegion(addedRegion: Region, newRegionList: Array<Region>) {
            addEditHistory(selectedRegionRef.current, regionListRef.current);
            setRegionList(newRegionList);
        }
        onDeletedRegion(deletedRegion: Region, newRegionList: Array<Region>) {
            addEditHistory(selectedRegionRef.current, regionListRef.current);
            setRegionList(newRegionList);
        }
        onChangedLabel(changedRegion: Region, newRegionList: Array<Region>) {
            addEditHistory(selectedRegionRef.current, regionListRef.current);
            setRegionList(newRegionList);
        }
        onDeformRegion(deformedRegion: Region, newRegionList: Array<Region>) {
            addEditHistory(selectedRegionRef.current, regionListRef.current);
            setRegionList(newRegionList);
        }
    })();

    const regionListCallback = new (class implements RegionListCallback {
        onChangeRegionList(newRegionList: Region[]): void {
            addEditHistory(selectedRegionRef.current, regionListRef.current);
            setRegionList(newRegionList);
        }
        onCategoriesUpdated(categoryList: Category[]): void {
            const newCategoryList = [...categoryList];
            setCategoryList(newCategoryList);
        }
        onRegionSelected(region: Region): void {
            setSelectedRegion(region);
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

    const handleError = (error: Error) => {
        switch (error.message) {
            case "Failed to fetch": {
                setSnackbarText("A network error has occurred.");
                setState({ ...state, open: true });
                break;
            }
            default: {
                setSnackbarText(`${error.message}`);
                setState({ ...state, open: true });
                break;
            }
        }
    }

    const getRegions = async () => {
        if (!props.selectedFile) {
            return;
        }

        setRegionList(new Array<Region>());

        if (!props.onlineMode) {
            return;
        }

        try {
            const h = await apis.fetchHash(props.selectedFile);
            setHashes(h);

            const result = await apis.fetchPageRegions(h);
            if (h === result.hashes) {
                setRegionList(result.regions);
            }
        } catch (error) {
            handleError(error);
        }
    }

    useEffect(() => {
        const onKeyDownListener = (event) => {
            event.preventDefault();

            if (event.key == 'z' && (event.ctrlKey || event.metaKey)) {
                restoreEditHistory();
            }
        }

        document.addEventListener("keydown", onKeyDownListener);

        return () => {
            document.removeEventListener("keydown", onKeyDownListener);
        };
    });

    useEffect(() => {
        if (!props.selectedFile) {
            init();
            return;
        }

        if (isDirty) {
            setShowSaveDialog(true);
            return;
        }

        setEditingFile(props.selectedFile);
    }, [props.selectedFile]);

    useEffect(() => {
        getRegions();
    }, [props.onlineMode]);

    useEffect(() => {
        if (!editingFile) {
            return;
        }

        idempotencyKey.current = uuidv4();
        clearEditHistory();
        getRegions();

    }, [editingFile]);

    useEffect(() => {
        const dirty = historyListState.length > 0;
        setDirty(dirty);

    }, [historyListState]);

    const clearEditHistory = () => {
        setHistoryList(Array());
    }

    const restoreEditHistory = () => {
        if (historyListState.length == 0) {
            return;
        }

        const lastHistoryIndex = historyListState.length - 1;
        const latestHistory = historyListState[lastHistoryIndex];
        setRegionList(latestHistory.regionList);
        setSelectedRegion(latestHistory.selectedRegion);

        const newHistoryList = [...historyListState.slice(0, lastHistoryIndex)];
        setHistoryList(newHistoryList);
    }

    const addEditHistory = (selectedRegion, regionList) => {
        const newHistoryList = [...historyListRef.current, new EditHistory(selectedRegion, regionList)];
        setHistoryList(newHistoryList);
    }

    const submitRegions = async () => {
        if (!props.selectedFile) {
            return;
        }
        if (!regionListState) {
            return;
        }

        try {
            if (!hashes) {
                const h = await apis.fetchHash(props.selectedFile);
                setHashes(h);
            }
            if (!hashes) {
                return;
            }

            await apis.submitPageRegions(idempotencyKey.current, hashes, regionListState);

            setSnackbarText("Save completed.");
            setState({ ...state, open: true });
            setDirty(false);
        } catch (error) {
            handleError(error);
        }
    };

    const saveRegions = async () => {
        if (!props.selectedFile) {
            return;
        }

        if (!regionListState) {
            return;
        }

        const regionsObj = convertRegionsToPathRegions(regionListState);
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
        restoreEditHistory();
    }

    const menu = () => {
        const showUndoMenu = () => {
            if (!historyListState) {
                return (<span></span>);
            }
            if (historyListState.length == 0) {
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
                    <IconButton color="inherit" onClick={submitRegions}>
                        <BackupIcon />
                    </IconButton>
                </Tooltip>
            );
        };

        const showImportExportMenu = () => {
            if (!editingFile) {
                return;
            }

            const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                setAnchorImportExportMenu(event.currentTarget);
            }
            const handleClose = () => {
                setAnchorImportExportMenu(null);
            }

            const handleImport = () => {
                handleClose();

                if (!importInput.current) {
                    return;
                }
                importInput.current.click();
            }
            const handleExport = () => {
                handleClose();

                saveRegions();
            }

            const handleChangeFile = (event) => {
                event.preventDefault();

                if (!regionListState) {
                    return;
                }

                const files = event.target.files;
                if (!files) {
                    return;
                }

                const file = files[0];

                var fileReader = new FileReader();
                fileReader.onload = (e) => {
                    const result = e.target?.result;
                    if (!result) {
                        return;
                    }
                    if (typeof result === 'string') {
                        const jsonObj = JSON.parse(result as string);
                        const regions = convertPointsToRegions(jsonObj['regions']);
                        setRegionList(regions);
                    }

                    if (importInput.current) {
                        importInput.current.value = "";
                    }
                };

                fileReader.readAsText(file);
            }

            const showExportMenu = () => {
                const disabled = (!regionListRef.current || regionListRef.current.length == 0);
                if (disabled) {
                    return (<MenuItem disabled onClick={handleExport}>Export</MenuItem>);
                }
                return (<MenuItem onClick={handleExport}>Export</MenuItem>);
            }

            return (
                <span>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorImportExportMenu}
                        keepMounted
                        open={Boolean(anchorImportExportMenu)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleImport}>Import</MenuItem>
                        {showExportMenu()}
                    </Menu >
                    <Tooltip title="Export region data" aria-label="export-regions">
                        <IconButton color="inherit" onClick={handleClick}>
                            <ImportExportIcon />
                        </IconButton>
                    </Tooltip>
                    <input
                        ref={importInput}
                        type="file"
                        name="files[]"
                        id="file"
                        accept="application/json"
                        onChange={handleChangeFile}
                        hidden
                    />
                </span >
            );
        }

        return (
            <div className={classes.menu}>
                {showUndoMenu()}
                {showServerMenu()}
                {showImportExportMenu()}
            </div>
        );
    }

    const showSaveDialog = () => {
        const handleSave = () => {
            if (props.onlineMode) {
                submitRegions();
            } else {
                saveRegions();
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
                    <RegionEditor
                        file={editingFile}
                        selectedCategory={selectedCategory}
                        regionList={regionListState}
                        selectedRegion={selectedRegionState}
                        callback={regionEditorCallback}
                    />
                </Grid>
                <Grid item xs={4} className={classes.regionList} >
                    <Container>
                        <RegionList
                            regionList={regionListState}
                            selectedRegion={selectedRegionState}
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

export interface Callback {
    onTurnOnlineRequested(): void
}
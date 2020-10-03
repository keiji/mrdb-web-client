import React, { useEffect, useState } from 'react';
import { RegionEditor } from './RegionEditor';
import RegionList from './RegionList';

import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import { Callback } from '../RegionEditorController';
import { Region } from '../Region';
import * as apis from "../api/crdbApi";

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        width: `100%`,
        height: `100%`,
        backgroundColor: theme.palette.background.paper,
        display: `flex`
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
}),
);

const callback = new (class implements Callback {
    onSelectedRegion(selectedRegion: Region | null) {
    }
    onAddedRegion(addedRegion: Region, regionList: Array<Region>) {
        console.log("onAddedRegion");
    }
    onDeletedRegion(deletedRegion: Region, regionList: Array<Region>) {
    }
    onChangedLabel(changedRegion: Region, regionList: Array<Region>) {
    }
})();

function RegionEditorContainer(props: any) {
    const classes = useStyles();

    const [selectedCategory, setSelectedCategory] = useState()
    const [selectedLabel, setSelectedLabel] = useState()
    const [regionList, setRegionList] = useState<Array<Region>>()

    const getRegions = async () => {
        const hashes = await apis.fetchHash(props.selectedFile);
        try {
            const rl = await apis.fetchPageRegions(hashes);
            setRegionList(rl);
        } catch (error) {
            setRegionList(new Array<Region>());
        }
    }

    useEffect(() => {
        if (!props.selectedFile) {
            return;
        }
        getRegions();
    }, [props.selectedFile]);

    return (
        <div className={classes.root}>
            <Grid container spacing={0}>
                <Grid item xs={9} className={classes.regionEditor}>
                    <RegionEditor selectedFile={props.selectedFile}
                        selectedCategory={selectedCategory}
                        selectedLabel={selectedLabel}
                        regionList={regionList}
                        callback={callback}
                    />
                </Grid>
                <Grid item xs={3} className={classes.regionList} >
                    <RegionList />
                </Grid>

            </Grid>
        </div>
    );
}

export default RegionEditorContainer;

import React, { useEffect, useState } from 'react';
import { RegionEditor } from './RegionEditor';
import RegionList from './RegionList';

import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import { Callback as RegionEditorCallback } from '../RegionEditorController';
import { Callback as RegionListCallback } from './RegionList';
import { Callback as CategorySettingCallback } from './CategorySetting';

import { Region } from '../Region';
import * as apis from "../api/crdbApi";
import { Category } from '../Category';
import { Label } from '../Label';

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

function RegionEditorContainer(props: any) {
    const classes = useStyles();

    const [categoryList, setCategoryList] = useState<Array<Category>>()
    const [selectedCategory, setSelectedCategory] = useState<Category>()

    const [labelList, setLabelList] = useState<Array<Label>>()

    const [regionList, setRegionList] = useState<Array<Region>>()
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)

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
                <Grid item xs={8} className={classes.regionEditor}>
                    <RegionEditor selectedFile={props.selectedFile}
                        selectedCategory={selectedCategory}
                        regionList={regionList}
                        selectedRegion={selectedRegion}
                        callback={regionEditorCallback}
                    />
                </Grid>
                <Grid item xs={4} className={classes.regionList} >
                    <RegionList
                        regionList={regionList}
                        selectedRegion={selectedRegion}
                        categoryList={categoryList}
                        selectedCategory={selectedCategory}
                        labelList={labelList}
                        callback={regionListCallback}
                        categorySettingCallback={categorySettingCallback}
                    />
                </Grid>

            </Grid>
        </div>
    );
}

export default RegionEditorContainer;

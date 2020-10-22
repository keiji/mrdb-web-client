import {
    Box, createStyles, IconButton, makeStyles, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Theme
} from '@material-ui/core';
import React, { } from 'react';

import {CategorySetting, Callback as CategorySettingCallback} from './CategorySetting';
import { Category } from '../entities/Category';
import { Region } from '../entities/Region';
import { Label } from '../entities/Label';

import MoveOrderUpIcon from '@material-ui/icons/ExpandLess';
import MoveOrderDownIcon from '@material-ui/icons/ExpandMore';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        height: `100%`,
        overflowY: `scroll`,
        backgroundColor: theme.palette.background.paper,
    },
    table: {
        minWidth: `100%`,
    },
}),
);

type Props = {
    selectedCategory: Category | undefined,
    regionList: Array<Region> | undefined,
    selectedRegion: Region | null,
    categoryList: Array<Category> | undefined,
    labelList: Array<Label> | undefined,
    callback: Callback,
    categorySettingCallback: CategorySettingCallback
}

export function RegionList(props: Props) {
    const classes = useStyles();

    if (!props.regionList) {
        return (<Box className={classes.root}></Box>);
    }

    const moveOrder = (regionList: Array<Region>, fromIndex: number, toIndex: number): Array<Region> => {
        const resultRegionList = [...regionList];

        const temp = resultRegionList[toIndex];
        resultRegionList[toIndex] = resultRegionList[fromIndex];
        resultRegionList[fromIndex] = temp;
        return resultRegionList;
    }

    const moveOrderDown = (index: number) => {
        if (!props.regionList) {
            return;
        }
        const newIndex = index + 1;
        const regionList = moveOrder(props.regionList, index, newIndex);

        props.callback.onChangeRegionList(regionList);
    }
    const moveOrderUp = (index: number) => {
        if (!props.regionList) {
            return;
        }
        const newIndex = index - 1;
        const regionList = moveOrder(props.regionList, index, newIndex);

        props.callback.onChangeRegionList(regionList);
    }

    const orderIcons = (index: number) => {
        if (!props.regionList) {
            return;
        }
        if (index == 0) {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderDown(index) }}>
                        <MoveOrderDownIcon />
                    </IconButton>
                </TableCell>
            );
        } else if (index == props.regionList.length - 1) {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderUp(index) }}>
                        <MoveOrderUpIcon />
                    </IconButton>
                </TableCell>
            );
        } else {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderUp(index) }}>
                        <MoveOrderUpIcon />
                    </IconButton>
                    <IconButton onClick={() => { moveOrderDown(index) }}>
                        <MoveOrderDownIcon />
                    </IconButton>
                </TableCell>
            );
        }
    }

    const selectedOrNot = (region: Region) => {
        if (props.selectedRegion == region) {
            return (<TableCell><RadioButtonCheckedIcon /></TableCell>);
        }
        return (<TableCell><RadioButtonUncheckedIcon /></TableCell>);

    }

    const selectRegion = (region: Region) => {
        props.callback.onRegionSelected(region);
    }

    const label = (labelValue: number) => {
        if (!props.labelList) {
            return (<TableCell>{labelValue}</TableCell>);
        }
        const label = props.labelList.filter((label: Label) => { return label.label == labelValue })[0];
        let labelName: string
        if (label) {
            labelName = label.name;
        } else {
            labelName = 'Unknown';
        }

        return (<TableCell>{labelValue}: {labelName}</TableCell>);
    }

    const showTable = () => {
        if (!props.regionList || props.regionList.length == 0) {
            return (<span></span>);
        }

        return (
            <TableContainer component={Paper}>
                <Table className={classes.table} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>Label</TableCell>
                            <TableCell align="center">Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.regionList.map((region: Region, index: number) => (
                            <TableRow key={index} onClick={() => { selectRegion(region) }}>
                                {selectedOrNot(region)}
                                {label(region.label)}
                                {orderIcons(index)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    return (
        <Box className={classes.root}>
            <CategorySetting
                categoryList={props.categoryList}
                selectedCategory={props.selectedCategory}
                callback={props.categorySettingCallback} />

            {showTable()}
        </Box>
    );
}

export interface Callback {
    onChangeRegionList(regionList: Array<Region>): void
    onCategoriesUpdated(categoryList: Array<Category>): void
    onRegionSelected(region: Region): void
}
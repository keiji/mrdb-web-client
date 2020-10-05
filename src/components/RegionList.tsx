import { Box, Container, createStyles, IconButton, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Theme } from '@material-ui/core';
import React, { useState } from 'react';
import { Region } from '../Region';
import MoveOrderUp from '@material-ui/icons/ExpandLess';
import MoveOrderDown from '@material-ui/icons/ExpandMore';
import CategorySetting from './CategorySetting';
import { Category } from '../Category';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import { Label } from '../Label';

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        overflowY: `scroll`,
        backgroundColor: theme.palette.background.paper,
    },
    table: {
        minWidth: `100%`,
    },
}),
);

function RegionList(props: any) {
    const classes = useStyles();

    if (!props.regionList) {
        return (<div></div>);
    }

    const moveOrder = (fromIndex: number, toIndex: number): Array<Region> => {
        const regionList = props.regionList;
        const temp = regionList[toIndex];
        regionList[toIndex] = regionList[fromIndex];
        regionList[fromIndex] = temp;
        return regionList;
    }

    const moveOrderDown = (index: number) => {
        const newIndex = index + 1;
        const regionList = moveOrder(index, newIndex);

        props.callback.onChangeRegionList(regionList);
    }
    const moveOrderUp = (index: number) => {
        const newIndex = index - 1;
        const regionList = moveOrder(index, newIndex);

        props.callback.onChangeRegionList(regionList);
    }

    const orderIcons = (index: number) => {
        if (index == 0) {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderDown(index) }}>
                        <MoveOrderDown />
                    </IconButton>
                </TableCell>
            );
        } else if (index == props.regionList.length - 1) {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderUp(index) }}>
                        <MoveOrderUp />
                    </IconButton>
                </TableCell>
            );
        } else {
            return (
                <TableCell>
                    <IconButton onClick={() => { moveOrderUp(index) }}>
                        <MoveOrderUp />
                    </IconButton>
                    <IconButton onClick={() => { moveOrderDown(index) }}>
                        <MoveOrderDown />
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
        const labelList: Array<Label> = props.labelList;
        if (!labelList) {
            return (<TableCell>{labelValue}</TableCell>);
        }
        const label = labelList.filter((label: Label) => { return label.label == labelValue })[0];

        return (<TableCell>{labelValue}: {label.name}</TableCell>);
    }

    return (
        <Box className={classes.root}>
            <CategorySetting
                categoryList={props.categoryList}
                selectedCategory={props.selectedCategory}
                callback={props.categorySettingCallback} />

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
        </Box>
    );
}

export default RegionList;

export interface Callback {
    onChangeRegionList(regionList: Array<Region>): void
    onCategoriesUpdated(categoryList: Array<Category>): void
    onRegionSelected(region: Region): void
}
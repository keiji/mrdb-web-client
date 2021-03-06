// eslint-disable-next-line @typescript-eslint/no-use-before-define
import * as React from 'react';

import { useEffect, useRef } from 'react';
import { createStyles, FormControl, InputLabel, makeStyles, MenuItem, Select, Theme } from '@material-ui/core';

import { Category } from '../entities/Category';
import * as apis from "../api/crdbApi";
import { Label } from '../entities/Label';

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        overflowY: `scroll`,
        backgroundColor: theme.palette.background.paper,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: `120px`,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}),
);

export interface Callback {
    onCategoriesUpdated(categoryList: Array<Category>): void
    onCategorySelected(category: Category): void

    onLabelsUpdated(labelList: Array<Label>): void
}

type Props = {
    categoryList: Array<Category> | null | undefined,
    selectedCategory: Category | null | undefined,
    callback: Callback,
}

export function CategorySetting(props: Props) {
    const classes = useStyles();

    const categorySelect = useRef(null);

    const getLabels = async (category: Category) => {
        const labels = await apis.fetchLabels(category.id);
        props.callback.onLabelsUpdated(labels);
    };

    const getCategories = async () => {
        const categories = await apis.fetchCategories();
        props.callback.onCategoriesUpdated(categories);
        props.callback.onCategorySelected(categories[0]);
        getLabels(categories[0]);
    };

    useEffect(() => {
        getCategories();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categorySelect]);

    const categorySelected = (event: React.ChangeEvent<{ value: unknown }>) => {
        const value = event.target.value
        if (typeof value === `number` && props.categoryList) {
            const category: Array<Category> = props.categoryList.filter((category: Category) => { return category.id === value });
            if (category) {
                props.callback.onCategorySelected(category[0]);
                getLabels(category[0]);
            }
        }
    }

    const selectedCategoryValue = () => {
        if (!props.selectedCategory) {
            return 0;
        }
        return props.selectedCategory.id;
    }

    const categoryList = () => {
        if (!props.categoryList) {
            return (<div></div>);
        }
        return props.categoryList.map((category: Category, index: number) => (
            <MenuItem value={category.id}>{category.name}</MenuItem>
        ));
    }

    return (
        <div className={classes.root} >
            <FormControl className={classes.formControl}>
                <InputLabel id="demo-simple-select-label">Category</InputLabel>
                <Select
                    value={selectedCategoryValue()}
                    onChange={categorySelected}
                    className={classes.selectEmpty}
                >
                    {categoryList()}
                </Select>
            </FormControl>
        </div>
    );
}

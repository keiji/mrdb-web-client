import { createStyles, makeStyles, Theme } from '@material-ui/core';
import React, { useEffect, useRef, useState } from 'react';
import { RegionEditorController } from '../RegionEditorController';
import * as manipulateImage from "../manipulateImage";

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        height: `100%`,
        backgroundColor: theme.palette.background.paper,
    },
    canvasContainer: {
        position: `relative`,
        height: `100%`,
        width: `100%`,
    },
    canvas: {
        cursor: `crosshair`,
    },
}),
);

let regionEditorController: RegionEditorController | null = null;

export function RegionEditor(props: any) {
    const [cacheImage, setImage] = useState<HTMLImageElement | null>(null);

    const classes = useStyles();

    const canvasContainer = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!props.file) {
            return;
        }

        if (regionEditorController) {
            regionEditorController.clearEditHistory();
        }

        manipulateImage.loadImage(props.file, (image: HTMLImageElement) => {
            if (!canvas.current) {
                return;
            }

            setImage(image);
        });

    }, [props.file]);

    useEffect(() => {
        if (!props.undoEvent) {
            return;
        }
        if (!regionEditorController) {
            return;
        }

        regionEditorController.restoreEditHistory();

    }, [props.undoEvent]);

    useEffect(() => {
        if (regionEditorController) {
            regionEditorController.destroy();
            regionEditorController = null;
        }
    }, [cacheImage]);

    useEffect(() => {
        if (!canvas.current) {
            return;
        }
        if (!canvasContainer.current) {
            return;
        }

        const image = cacheImage;
        if (image == null) {
            return;
        }

        if (!regionEditorController) {
            regionEditorController = new RegionEditorController(
                canvas.current,
                image,
                props.selectedCategory,
                props.callback
            );
        }
        regionEditorController.calcMargin(16);

        regionEditorController.category = props.selectedCategory;
        regionEditorController.regionList = props.regionList;
        regionEditorController.redraw();

    }, [cacheImage, props.regionList]);

    useEffect(() => {
        if (!canvas.current) {
            return;
        }
        if (!canvasContainer.current) {
            return;
        }

        canvas.current.width = canvasContainer.current.clientWidth;
        canvas.current.height = canvasContainer.current.clientHeight;

        if (regionEditorController) {
            regionEditorController.redraw();
        }
    }, [canvas, canvasContainer]);

    useEffect(() => {
        if (regionEditorController) {
            regionEditorController.selectedRegion = props.selectedRegion;
            regionEditorController.redraw();
        }
    }, [props.selectedRegion]);

    useEffect(() => {
        if (regionEditorController) {
            regionEditorController.category = props.selectedCategory;
        }
    }, [props.selectedCategory]);

    window.addEventListener("resize", (event) => {
        if (!canvas.current) {
            return;
        }
        if (!canvasContainer.current) {
            return;
        }

        if (cacheImage && regionEditorController) {
            canvas.current.width = canvasContainer.current.clientWidth;
            canvas.current.height = canvasContainer.current.clientHeight;
            regionEditorController.calcMargin(16);
            regionEditorController.redraw();
        }
    });

    return (
        <div className={classes.canvasContainer} ref={canvasContainer}>
            <canvas className={classes.canvas} tabIndex={-1} ref={canvas} />
        </div>
    );
}

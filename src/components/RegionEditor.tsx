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

let canvasMaxWidth = 0;
let canvasMaxHeight = 0;

function init(canvasContainer: HTMLDivElement) {
    canvasMaxWidth = canvasContainer.clientWidth;
    canvasMaxHeight = canvasContainer.clientHeight;
}

const setCanvasSize = (
    canvas: HTMLCanvasElement,
    sizeRatio: [number, number]
) => {
    canvas.width = canvasMaxWidth * sizeRatio[0];
    canvas.height = canvasMaxHeight * sizeRatio[1];
};

const fitImageAndCanvas = (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement
) => {
    console.log('fitImageAndCanvas');

    const ratio = Math.min(
        canvasMaxWidth / image.width,
        canvasMaxHeight / image.height
    );

    image.width = Math.round(image.width * ratio);
    image.height = Math.round(image.height * ratio);

    console.log(image.width)
    canvas.width = image.width;
    canvas.height = image.height;

    const marginHorizontal = canvasMaxWidth - image.width;
    const marginVertical = canvasMaxHeight - image.height;

    const marginTop = marginVertical / 2;
    const marginBottom = marginVertical - marginTop;
    const marginLeft = marginHorizontal / 2;
    const marginRight = marginHorizontal - marginLeft;

    canvas.style.marginTop = `${marginTop}px`;
    canvas.style.marginBottom = `${marginBottom}px`;
    canvas.style.marginLeft = `${marginLeft}px`;
    canvas.style.marginRight = `${marginRight}px`;
};

export function RegionEditor(props: any) {
    const [cacheImage, setImage] = useState<HTMLImageElement | null>(null);

    const classes = useStyles();

    const canvasContainer = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!props.selectedFile) {
            return;
        }

        manipulateImage.loadImage(props.selectedFile, (image: HTMLImageElement) => {
            if (!canvas.current) {
                return;
            }

            setImage(image);
            fitImageAndCanvas(image, canvas.current);
        });

    }, [props.selectedFile]);

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

        init(canvasContainer.current);
        setCanvasSize(canvas.current, [1.0, 1.0]);

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

        init(canvasContainer.current);

        if (cacheImage && regionEditorController) {
            fitImageAndCanvas(cacheImage, canvas.current);
            regionEditorController.redraw();
        }
    });

    return (
        <div className={classes.canvasContainer} ref={canvasContainer}>
            <canvas className={classes.canvas} tabIndex={-1} ref={canvas} />
        </div>
    );
}

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';

import { RegionEditorController, Callback as RegionEditorCallback } from './RegionEditorController';
import * as manipulateImage from "../../utils/manipulateImage";
import { Category } from '../../entities/Category';
import { Region } from '../../entities/Region';

const DEFAULT_LABEL = 0;
const DEFAULT_MARGIN = 16;

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

type Props = {
    file: File | null | undefined,
    selectedCategory: Category | undefined,
    regionList: Array<Region> | undefined,
    selectedRegion: Region | null,
    callback: RegionEditorCallback,
}

export function RegionEditor(props: Props) {
    const classes = useStyles();

    const [cacheImage, setImage] = useState<HTMLImageElement | null>(null);
    const regionEditorControllerRef = useRef<RegionEditorController | null>(null);

    const canvasContainer = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);

    // add/remove resize listeners
    useEffect(() => {
        const resizeEvent = (event) => {
            if (!canvas.current) {
                return;
            }
            if (!canvasContainer.current) {
                return;
            }

            if (cacheImage && regionEditorControllerRef.current) {
                canvas.current.width = canvasContainer.current.clientWidth;
                canvas.current.height = canvasContainer.current.clientHeight;
                regionEditorControllerRef.current.calcMargin(DEFAULT_MARGIN);
                regionEditorControllerRef.current.redraw();
            }
        };

        window.addEventListener("resize", resizeEvent);

        return () => {
            window.removeEventListener("resize", resizeEvent);
        }
    });

    // add/remove mouse and key event listeners
    useEffect(() => {
        if (canvas.current) {
            const regionEditorController = new RegionEditorController(
                canvas.current,
                props.callback
            );

            canvas.current.addEventListener("mousedown", regionEditorController.onMouseDownListener);
            canvas.current.addEventListener("mousemove", regionEditorController.onMouseMoveListener);
            canvas.current.addEventListener("mouseup", regionEditorController.onMouseUpListener);

            // https://qiita.com/jay-es/items/cd30c73989659374698a
            document.addEventListener("keydown", regionEditorController.onKeyDownListener);
            document.addEventListener("keyup", regionEditorController.onKeyUpListener);

            regionEditorControllerRef.current = regionEditorController;
        }

        return () => {
            if (canvas.current && regionEditorControllerRef.current) {
                const regionEditorController = regionEditorControllerRef.current;
                canvas.current.removeEventListener("mousedown", regionEditorController.onMouseDownListener);
                canvas.current.removeEventListener("mousemove", regionEditorController.onMouseMoveListener);
                canvas.current.removeEventListener("mouseup", regionEditorController.onMouseUpListener);

                document.removeEventListener("keydown", regionEditorController.onKeyDownListener);
                document.removeEventListener("keyup", regionEditorController.onKeyUpListener);
            }
        };;

    }, [canvas]);

    useEffect(() => {
        if (!props.file) {
            // reset editor
            setImage(null);
            return;
        }

        manipulateImage.loadImage(props.file, (image: HTMLImageElement) => {
            setImage(image);
        });

    }, [props.file]);

    useEffect(() => {
        if (regionEditorControllerRef.current) {
            regionEditorControllerRef.current.image = cacheImage;
            regionEditorControllerRef.current.calcMargin(DEFAULT_MARGIN);
            regionEditorControllerRef.current.category = props.selectedCategory;
            regionEditorControllerRef.current.label = DEFAULT_LABEL;
            regionEditorControllerRef.current.regionList = props.regionList;
            regionEditorControllerRef.current.redraw();
        }
    }, [cacheImage]);

    useEffect(() => {
        if (!props.regionList || !props.selectedCategory) {
            return;
        }

        if (regionEditorControllerRef.current) {
            regionEditorControllerRef.current.category = props.selectedCategory;
            regionEditorControllerRef.current.label = DEFAULT_LABEL;
            regionEditorControllerRef.current.regionList = props.regionList;
            regionEditorControllerRef.current.redraw();
        }
    }, [props.regionList]);

    useEffect(() => {
        if (!canvas.current) {
            return;
        }
        if (!canvasContainer.current) {
            return;
        }

        canvas.current.width = canvasContainer.current.clientWidth;
        canvas.current.height = canvasContainer.current.clientHeight;

        if (regionEditorControllerRef.current) {
            regionEditorControllerRef.current.redraw();
        }
    }, [canvas, canvasContainer]);

    useEffect(() => {
        if (regionEditorControllerRef.current) {
            regionEditorControllerRef.current.selectedRegion = props.selectedRegion;
            regionEditorControllerRef.current.redraw();
        }
    }, [props.selectedRegion]);

    useEffect(() => {
        if (!props.selectedCategory) {
            return;
        }

        if (regionEditorControllerRef.current) {
            regionEditorControllerRef.current.category = props.selectedCategory;
        }
    }, [props.selectedCategory]);

    return (
        <div className={classes.canvasContainer} ref={canvasContainer}>
            <canvas className={classes.canvas} tabIndex={-1} ref={canvas} />
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';

import { Box, Container, GridList, IconButton } from '@material-ui/core';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import ClearIcon from '@material-ui/icons/Clear';

import add_photo_alternate_black from '../add_photo_alternate-black-48dp.svg';


const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        flexWrap: 'nowrap',
        // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
        transform: 'translateZ(0)',
    },
    imageBoxContainer: {
        width: `200px`,
        height: `100%`,
        minWidth: `150px`,
        margin: `8px`,
        border: `1px  solid #cccccc`,
        position: `relative`,
    },
    imageContainer: {
        width: `100%`,
        height: `100%`,
        display: `flex`,
        alignItems: `center`,
        position: `absolute`,
    },
    image: {
        objectFit: `cover`,
        width: `100%`,
        height: `auto`,
        marginLeft: `auto`,
        marginRight: `auto`,
    },
    imagePlaceholder: {
        marginLeft: `auto`,
        marginRight: `auto`,
    },
    boxFile: {
        display: `none`,
    },
    tapContainer: {
        width: `100%`,
        height: `100%`,
        position: `absolute`,
        display: `flex`,
        justifyContent: `flex-end`,
        alignItems: `start`,
    },
    selectionBox: {
        width: `100%`,
        height: `100%`,
        position: `absolute`,
    },
    clearIcon: {
    },
}),
);

export function ImageList(props: any) {
    const classes = useStyles();

    const [imageFiles, setImageFiles] = useState(Array<File>());
    const [previewImages, setPreviewImages] = useState(Array<string | ArrayBuffer>());

    const fileInput = useRef<HTMLInputElement>(null)

    useEffect(() => {
        console.log("previewImages has changed.");
    }, [previewImages])

    const showFileDialog = () => {
        console.log('showFileDialog');
        const fileInputSnapshot = fileInput.current;
        if (!fileInputSnapshot) {
            return;
        }
        fileInputSnapshot.click();
    }

    function changeFile(event: any) {
        event.preventDefault();

        const files = event.target.files;
        imageFiles.unshift(...files);
        imageFiles.forEach((imageFile, index) => {
            readFile(index);
        });
        setImageFiles([...imageFiles]);
        props.callback.onFileListUpdated(imageFiles)
    }

    const readFile = (index: number) => {
        if (!previewImages) {
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            const result = event.target?.result;
            if (!result) {
                return;
            }
            previewImages[index] = result;
            setPreviewImages([...previewImages])
        };
        fileReader.readAsDataURL(imageFiles[index]);
    };

    const createPreviewImage = (image: string, classes, onClick: (event: any) => void, onDelete: (event: any) => void) => {
        return (
            <Box className={classes.imageBoxContainer}>
                <Container className={classes.imageContainer}>
                    <img className={classes.image} src={image} />
                </Container>
                <Box className={classes.tapContainer} >
                    <Box className={classes.selectionBox} onClick={onClick} />
                    <IconButton className={classes.clearIcon} color="inherit" onClick={onDelete}>
                        <ClearIcon />
                    </IconButton>
                </Box>
            </Box>
        )
    }

    const createPreviewImages = (classes, callback: Callback) => {
        if (!previewImages) {
            return;
        }

        return (
            previewImages.map((image, index: number) => {
                const file = imageFiles[index];
                const onSelect = (event: any) => {
                    event.preventDefault();

                    callback.onFileSelected(file);
                };
                const onDelete = (event: any) => {
                    event.preventDefault();

                    const index = imageFiles.indexOf(file);
                    if (index == -1) {
                        return;
                    }

                    imageFiles.splice(index, 1);
                    previewImages.splice(index, 1);

                    setImageFiles([...imageFiles]);
                    setPreviewImages([...previewImages])

                    props.callback.onFileListUpdated(imageFiles)
                };
                if (typeof image === 'string') {
                    return createPreviewImage(image, classes, onSelect, onDelete);
                }
            })
        )
    }

    return (
        <div className={classes.root}>
            <GridList className={classes.gridList}>

                <Box className={classes.imageBoxContainer}>
                    <Box className={classes.imageContainer} onClick={showFileDialog}>
                        <img className={classes.imagePlaceholder} src={add_photo_alternate_black} />
                    </Box>
                </Box>

                {createPreviewImages(classes, props.callback)}
                <input
                    ref={fileInput}
                    className={classes.boxFile}
                    type="file"
                    name="files[]"
                    id="file"
                    multiple
                    onChange={changeFile}
                />
            </GridList>
        </div>
    );
}

export interface Callback {
    onFileSelected(file: File): void
    onFileListUpdated(fileList: Array<File>): void
}
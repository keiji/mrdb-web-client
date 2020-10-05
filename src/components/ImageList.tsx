import React, { useState, useEffect, useRef } from 'react';

import { Container, GridList } from '@material-ui/core';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

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
    imageContainer: {
        width: `200px`,
        display: `flex`,
        alignItems: `center`,
        minWidth: `150px`,
        margin: `8px`,
        border: `1px  solid #cccccc`,
    },
    image: {
        objectFit: `cover`,
        width: `100%`,
        height: `auto`,
        maxWidth: `200px`,
        maxHeight: `100%`,
        marginLeft: `auto`,
        marginRight: `auto`,
    },
    imagePlaceholder: {
        marginLeft: `auto`,
        marginRight: `auto`,
    },
    boxFile: {
        display: `none`,
    }
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
        setImageFiles(imageFiles);
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

    const createPreviewImage = (image: string, classes, onClick: () => void) => {
        return (
            <Container className={classes.imageContainer} onClick={onClick}>
                <img className={classes.image} src={image} />
            </Container>

        )
    }

    const createPreviewImages = (classes, callback: Callback) => {
        if (!previewImages) {
            return;
        }

        return (
            previewImages.map((image, index: number) => {
                const file = imageFiles[index];
                const onSelect = () => {
                    callback.onFileSelected(file);
                };
                if (typeof image === 'string') {
                    return createPreviewImage(image, classes, onSelect);
                }
            })
        )
    }

    return (
        <div className={classes.root}>
            <GridList className={classes.gridList}>
                <Container onClick={showFileDialog} className={classes.imageContainer}>
                    <img className={classes.imagePlaceholder} src={add_photo_alternate_black} />
                </Container>

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
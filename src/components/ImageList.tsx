import React, { useState, useEffect, useRef } from 'react';

function ImageList(props: any) {
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
        console.log('changeFile');

        event.preventDefault();
        const files = event.target.files;
        imageFiles.unshift(...files);
        console.log(`reaimageFilesdFile` + imageFiles.length);
        imageFiles.forEach((imageFile, index) => {
            console.log(`readFile` + imageFiles.length);
            readFile(index);
        });
        console.log('setImageFiles ' + imageFiles.length);
        setImageFiles(imageFiles);
    }

    const readFile = (index: number) => {
        if (!previewImages) {
            return;
        }

        console.log(`Do readFile`);

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

    const createPreviewImage = (image: string) => {
        return (
            <li>
                <img src={image} />
            </li>
        )
    }

    const createPreviewImages = () => {
        console.log("createPreviewImages")

        if (!previewImages) {
            return;
        }

        console.log("createPreviewImages2")


        return (
            previewImages.map((image) => {
                console.log(typeof image)
                if (typeof image === 'string') {
                    return createPreviewImage(image);
                }
            })
        )
    }

    return (
        <div>
            <ul>
                <li onClick={showFileDialog}>
                    <div>
                        <img src="../assets/add_photo_alternate-black-48dp.svg" />
                    </div>
                </li>
                {createPreviewImages()}
            </ul>
            <input
                ref={fileInput}
                className="box_file"
                type="file"
                name="files[]"
                id="file"
                multiple
                onChange={changeFile}
            />
        </div>);
}

export default ImageList;

interface Callback {
    onEvent(message: string): void
}
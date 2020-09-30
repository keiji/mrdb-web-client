import React, { useRef, useState } from 'react';

import './destyle.css';
import './App.css';

import RegionEditorContainer from './components/RegionEditorContainer';
import ImageList from './components/ImageList';

import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const imageListContainer = useRef<HTMLDivElement>(null);
  const [imageListShown, setImageListShown] = useState(true);

  const toggleImageList = () => {
    setImageListShown(!imageListShown);
  }

  const imageListContainerClass = () => {
    const clazz: string = `image_list_container` + ` ` + (imageListShown ? 'image_list_container_shown' : '');
    console.log(clazz);

    return clazz;
  }
  return (
    <div className="App">
      <Button variant="primary">Primary</Button>
      <div className="region_editor_container">
        <RegionEditorContainer />
      </div>
      <div ref={imageListContainer} className={imageListContainerClass()}>
        <span className="horizontal_title" onClick={toggleImageList}>Image List</span>
        <ImageList />
      </div>
    </div >
  );
}

export default App;

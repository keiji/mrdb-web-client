import React, { useState } from 'react';
import RegionEditor from './RegionEditor';
import RegionList from './RegionList';

function RegionEditorContainer(props: any) {
    const [count, setCount] = useState(0);

    const callback = new class Callback {
        onEvent(message: string) {
            console.log(message)
            setCount(count + 1);
        }
    }();

    return (
        <div>
            <div className="region_editor_container">
                <RegionEditor />
            </div>
            <div className="region_list_container">
                <RegionList />
            </div>
        </div>
    );
}

export default RegionEditorContainer;

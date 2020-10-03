import React, { useState } from 'react';

import '../RegionEditor.css';

function RegionEditor(props: any) {
    const [isFinished, setFinished] = useState(false);
    const dummyList = () => {
        return [2, 5, 7, 4].map((num) =>
            <li>{num}</li>
        );
    }
    const handleClick = () => {
        props.callback.onEvent('hi');
        setFinished(!isFinished);
    }
    const condition = () => {
        if (isFinished) {
            return (<span>ate</span>)
        } else {
            return (<span>eat</span>)
        }
    }

    return (
        <div className="region-editor-container">
        </div>
    );
}

export default RegionEditor;

interface Callback {
    onEvent(message: string): void
}
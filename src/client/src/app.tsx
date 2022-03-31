import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './app.scss'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RunShellView from './views/runner/shell.view';
import ReactiveEditorView from './views/reactive-editor/reactive-editor.view';
import RunShellViewDemo from './views/runner/shell.view.demo';

ReactDOM.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RunShellView />} />
        <Route path="edit" element={<ReactiveEditorView />} />
      </Routes>
    </BrowserRouter>
    ,
    document.getElementById('app') as HTMLElement
  );
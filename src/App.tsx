import type { Component } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import LandingView from "./views/landing";
import { createStore } from "solid-js/store";
import { RouteProps, RouteSectionProps } from "@solidjs/router";

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    return (
        <>
            <h1>header</h1>
            {props.children}
        </>
    );
};

export default App;

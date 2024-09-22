/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';
import { Route, Router } from "@solidjs/router";
import LandingView from "./views/landing";
import LoginView from "./views/login";
import ErrorView from "./views/error";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
    );
}

render(
    () => (
        <Router root={App}>
            <Route path="/" component={LandingView} />
            <Route path="/login" component={LoginView} />
            <Route path="*paramName" component={ErrorView} />
        </Router>
    ),
    root!
);

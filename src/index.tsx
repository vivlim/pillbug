/* @refresh reload */
import { ErrorBoundary, render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { Route, Router } from "@solidjs/router";
import LoginView from "./views/login";
import ErrorView from "./views/error";
import UserProfile from "./views/userprofile";
import PostPage from "./views/postpage";
import DevEditDialogPage from "./views/dev/editdialogpage";
import Feed from "./views/feed";
import NotSignedInLandingView from "./views/notsignedin";
import { FacetNavigationFrame } from "./views/facetnavigation";
import { NotificationsFacet } from "./views/facets/notifications";

import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource/atkinson-hyperlegible/700-italic.css";
import { ErrorBox } from "./components/error";
import { lazy } from "solid-js";

const root = document.getElementById("root");

const HomeView = lazy(() => import("./views/home"));

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
    );
}

render(
    () => (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox
                    error={e}
                    description="Failed to load page (top level catch)"
                />
            )}
        >
            <Router root={App}>
                <Route path="/" component={HomeView} />
                <Route
                    path="/feed"
                    component={() => {
                        return (
                            <FacetNavigationFrame>
                                <Feed />
                            </FacetNavigationFrame>
                        );
                    }}
                />
                <Route
                    path="/notifications"
                    component={() => {
                        return (
                            <FacetNavigationFrame>
                                <NotificationsFacet />
                            </FacetNavigationFrame>
                        );
                    }}
                />
                <Route
                    path="/search"
                    component={() => {
                        return (
                            <FacetNavigationFrame>
                                placeholder for search
                            </FacetNavigationFrame>
                        );
                    }}
                />
                <Route
                    path="/profile"
                    component={() => {
                        return (
                            <FacetNavigationFrame>
                                placeholder for profile
                            </FacetNavigationFrame>
                        );
                    }}
                />
                <Route
                    path="/settings"
                    component={() => {
                        return (
                            <FacetNavigationFrame>
                                placeholder for settings
                            </FacetNavigationFrame>
                        );
                    }}
                />
                <Route path="/about" component={NotSignedInLandingView} />
                <Route path="/login" component={LoginView} />
                <Route path="/user/:username" component={UserProfile} />
                <Route path="/post/:postId" component={PostPage} />
                <Route path="*paramName" component={ErrorView} />
                <Route path="/dev/editDialog" component={DevEditDialogPage} />
            </Router>
        </ErrorBoundary>
    ),
    root!
);

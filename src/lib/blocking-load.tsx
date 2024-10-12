import { createEffect, Resource } from "solid-js";
import { StoreBacked } from "./store-backed";

export interface LoadingOperation {
    label: string;
    key: string;
    complete: boolean;
    error?: Error | undefined;
}

export const initialLoadOperations: LoadingOperation[] = [];

interface ProgressTrackerState {
    operations: LoadingOperation[];
}

/** Reactive container for multiple operations that should block loading */
export class BlockingLoadProgressTracker extends StoreBacked<ProgressTrackerState> {
    constructor(initialOperations: LoadingOperation[]) {
        if (initialOperations === undefined) {
            throw new Error("A list of operations was not passed in");
        }
        super({ operations: initialOperations.slice() });
    }

    /** Push a new operation that is manually completed. */
    public pushNewOperation(label: string, key: string) {
        this.setStore("operations", this.store.operations.length, {
            label,
            key,
            complete: false,
        });
    }

    /** Push a new operation that completes when the provided resource is finished. If there is an error, that will be exposed (and probably displayed by a component) */
    public pushNewResourceOperation(
        label: string,
        key: string,
        resource: Resource<any>
    ) {
        this.setStore("operations", this.store.operations.length, {
            label,
            key,
            complete: false,
        });

        createEffect(() => {
            const updateComplete = (x: boolean) =>
                this.updateOperationCompletion(key, x);
            switch (resource.state) {
                case "ready":
                    updateComplete(true);
                    break;
                case "errored":
                    updateComplete(false);
                    this.updateOperationError(key, resource.error);
                    break;
                case "pending":
                    updateComplete(false);
                    break;
                case "refreshing":
                    updateComplete(false);
                    break;
                case "unresolved":
                    updateComplete(false);
                    break;
            }
        });
    }

    public updateOperationCompletion(key: string, complete: boolean) {
        this.setStore(
            "operations",
            (op) => op.key === key,
            "complete",
            complete
        );
        this.updateOperationError(key, undefined);
    }

    public updateOperationError(key: string, error: Error | undefined) {
        this.setStore("operations", (op) => op.key === key, "error", error);
    }

    public getActiveOperations() {
        return this.store.operations;
    }

    public areAllOperationsComplete() {
        // If there are no operations yet... then we aren't complete yet.
        if (this.store.operations.length === 0) {
            return false;
        }
        // Count number of incomplete operations.
        return this.store.operations.filter((o) => !o.complete).length === 0;
    }
}

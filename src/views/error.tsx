import type { Component } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const ErrorView: Component = () => {
    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self">
                <Card>
                    <CardHeader>
                        <CardTitle>oh no</CardTitle>
                    </CardHeader>
                    <CardContent>not found</CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default ErrorView;

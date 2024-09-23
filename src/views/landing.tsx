import { A } from "@solidjs/router";
import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";

const LandingView: Component = () => {
    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self">
                <Card>
                    <CardHeader>
                        <CardTitle>pillbug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>you aren't signed in.</p>
                        <p>
                            <A href="/login" class="underline">
                                Log in
                            </A>
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default LandingView;

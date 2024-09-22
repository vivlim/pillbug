import { A } from "@solidjs/router";
import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";

const LandingView: Component = () => {
    return (
        <Grid cols={1} colsMd={2} class="w-full gap-2">
            <Col span={1} spanMd={2}>
                <Card>
                    <CardHeader>
                        <CardTitle>pillbug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>you aren't signed in. wanna?</p>
                        <p>
                            <A href="/login">Log in</A>
                        </p>
                    </CardContent>
                </Card>
            </Col>
        </Grid>
    );
};

export default LandingView;

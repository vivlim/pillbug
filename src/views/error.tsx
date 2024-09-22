import type { Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";

const ErrorView: Component = () => {
    return (
        <Grid cols={1} colsMd={2} class="w-full gap-2">
            <Col span={1} spanMd={2}>
                <Card>
                    <CardHeader>
                        <CardTitle>oh no</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>ouchie</p>
                    </CardContent>
                </Card>
            </Col>
        </Grid>
    );
};

export default ErrorView;

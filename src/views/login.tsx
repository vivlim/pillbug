import { createSignal, type Component } from "solid-js";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import {
    TextField,
    TextFieldInput,
    TextFieldLabel,
} from "~/components/ui/text-field";

const LoginView: Component = () => {
    const [newInstance, setInstance] = createSignal("");
    return (
        <Grid cols={1} colsMd={2} class="w-full gap-2">
            <Col span={1} spanMd={2}>
                <Card>
                    <CardHeader>
                        <CardTitle>pillbug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TextField>
                            <TextFieldLabel for="instanceUrl">
                                Instance URL
                            </TextFieldLabel>
                            <TextFieldInput
                                type="url"
                                id="instanceUrl"
                                value={newInstance()}
                                onInput={(e) =>
                                    setInstance(e.currentTarget.value)
                                }
                            />
                        </TextField>
                        <Button>Log in</Button>
                    </CardContent>
                </Card>
            </Col>
        </Grid>
    );
};

export default LoginView;

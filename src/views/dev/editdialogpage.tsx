import { createSignal, type Component } from "solid-js";
import EditDialog from "../editdialog";
import { Button } from "~/components/ui/button";

const DevEditDialogPage: Component = () => {
    const [open, setOpen] = createSignal(true);

    return (
        <>
            <EditDialog open={open()} onOpenChange={setOpen}></EditDialog>
            {!open() && (
                <div>
                    <p>the dialog is not open right now.</p>

                    <Button onClick={() => setOpen(true)}>open it</Button>
                </div>
            )}
        </>
    );
};

export default DevEditDialogPage;

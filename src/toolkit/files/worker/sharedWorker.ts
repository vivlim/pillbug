import * as Comlink from "comlink";
import { IPillbugFilesystem } from "../ipillbugfilesystem";
import { Logger } from "tslog";


/** @ts-ignore */
onconnect = function (event) {
    const port = event.ports[0];
    const fs = {} //new PillbugFilesystemWorker();

    Comlink.expose(fs);

    port.start();
};
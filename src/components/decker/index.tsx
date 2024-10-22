import { Component, createMemo } from "solid-js";
//import "./vendored/lil.js";
//import "./vendored/repl.js";
import "./vendored/decker.js";

const DeckerComponent: Component<{}> = (props) => {
    const deckerMemo = createMemo(() => {});
    return (
        <div id="decker_root">
            <a id="target" style="display:none"></a>
            <img id="loader" style="display:none" />
            <input id="source" type="file" style="display:none" />
            <canvas id="render" style="display:none"></canvas>
            <canvas id="lrender" style="display:none"></canvas>
            <canvas id="rrender" style="display:none"></canvas>
            <canvas width="0" height="0" id="ltools"></canvas>
            <canvas id="display"></canvas>
            <canvas width="0" height="0" id="rtools"></canvas>
        </div>
    );
};
export default DeckerComponent;

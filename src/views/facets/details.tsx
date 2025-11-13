import { Component, For } from "solid-js";
import { default as licenseReport } from "../../../license-report.json";
import { default as licenseReportDev } from "../../../license-report-dev.json";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";

interface LicenseReportItem {
    name: string;
    author: string;
    link: string;
    installedVersion: string;
    remoteVersion?: string;
    definedVersion?: string;
    licenseType: string;
    licensePeriod?: string;
    department?: string;
    material?: string;
    relatedTo?: string;
}

const ThirdPartyLicensesFacet: Component = () => {
    const extras: LicenseReportItem[] = [
        {
            // manually vendored under /src/tegaki
            name: "Tegaki",
            author: "@desuwa",
            link: "https://github.com/desuwa/tegaki",
            installedVersion: "0.9.4",
            licenseType: "MIT",
        },
    ];
    const thirdPartyComponents = extras.concat(licenseReport);
    return (
        <div class="flex flex-col w-full list-none p-6 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Third party software</CardTitle>
                </CardHeader>
                <CardDescription class="px-4 post-content">
                    <p>
                        pillbug makes use of {thirdPartyComponents.length}{" "}
                        third-party components at runtime, as well as{" "}
                        {licenseReportDev.length} development dependencies.
                    </p>
                    <p>they are:</p>
                    <ul>
                        <For each={thirdPartyComponents}>
                            {(l) => <ThirdPartyComponentComponent item={l} />}
                        </For>
                    </ul>
                    <p>and the development dependencies:</p>
                    <ul>
                        <For each={licenseReportDev}>
                            {(l) => <ThirdPartyComponentComponent item={l} />}
                        </For>
                    </ul>
                </CardDescription>
                <CardFooter></CardFooter>
            </Card>
        </div>
    );
};

const ThirdPartyComponentComponent: Component<{ item: LicenseReportItem }> = ({
    item,
}) => {
    let link = item.link;
    if (link.startsWith("git+https://")) {
        link = link.substring(4);
    }
    return (
        <li>
            <span>{item.name}</span>
            <span class="pbSubtleText ml-2">{item.installedVersion}</span>
            <ul>
                <li>
                    <a href={link} target="_blank">
                        {link}
                    </a>
                </li>
                <li>Author: {item.author}</li>

                <li>License: {item.licenseType}</li>
            </ul>
        </li>
    );
};
export default ThirdPartyLicensesFacet;

import { useSearchParams } from "@solidjs/router";
import { Account } from "megalodon/lib/src/entities/account";
import { Tag } from "megalodon/lib/src/entities/tag";
import { Hashtag } from "megalodon/lib/src/firefish/entities/hashtag";
import {
    Component,
    For,
    Match,
    Show,
    Switch,
    createEffect,
    createResource,
    createSignal,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import {
    PreprocessedPost,
    wrapUnprocessedStatus,
} from "~/components/post/preprocessed";
import { EnterToSubmitShortcut, Textbox } from "~/components/textbox";
import { Button } from "pillbug-components/ui/button";
import { AvatarImage, AvatarLink } from "~/components/user/avatar";
import { unwrapResponse } from "~/lib/clientUtil";

export const SearchFacet: Component = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = createSignal<string>("");
    let button: HTMLButtonElement;
    let input: HTMLInputElement;

    return (
        <div>
            <div class="textboxRow pbCardSecondary p-2">
                <Textbox
                    value={query()}
                    setter={setQuery}
                    ref={input!}
                    immediateFocus={true}
                    shortcuts={EnterToSubmitShortcut(() => {
                        button.focus(); // Moving the focus off of the textbox will cause its setter to be invoked immediately.
                        input.focus();
                        setSearchParams(
                            {
                                query: query(),
                            },
                            { scroll: true }
                        );
                    })}
                >
                    🔍
                </Textbox>

                <Button
                    ref={button!}
                    onClick={() => {
                        setSearchParams(
                            {
                                query: query(),
                            },
                            { scroll: true }
                        );
                    }}
                >
                    Search
                </Button>
            </div>

            <SearchResults
                query={
                    searchParams.query as
                        | string
                        | undefined /* ignore string[], hopefully it doesn't matter */
                }
            />
        </div>
    );
};

export type SearchResultsProps = {
    query?: string;
    searchOptions?: {
        type?: "accounts" | "hashtags" | "statuses";
        limit?: number;
        max_id?: string;
        min_id?: string;
        resolve?: boolean;
        offset?: number;
        following?: boolean;
        account_id?: string;
        exclude_unreviewed?: boolean;
    };
};
export const SearchResults: Component<SearchResultsProps> = (props) => {
    const auth = useAuth();

    const [results, searchResourceAction] = createResource(
        () => {
            return { ...props }; // Splatting props allows the resource to react to changes in them
        },
        async (props) => {
            if (props.query === undefined) {
                return undefined;
            }
            const results = unwrapResponse(
                await auth.assumeSignedIn.client.search(
                    props.query,
                    props.searchOptions
                )
            );
            return results;
        }
    );

    return (
        <Switch>
            <Match when={results.loading}>loading results</Match>
            <Match when={results() === undefined}>no results</Match>
            <Match when={results() !== undefined}>
                <div>
                    <div class="pbCardSecondary p-2">{`search results for '${props.query}'`}</div>
                    <ul>
                        <For each={results()?.accounts}>
                            {(account) => {
                                return (
                                    <li>
                                        <SearchResultAccount
                                            account={account}
                                        />
                                    </li>
                                );
                            }}
                        </For>
                        <For each={results()?.hashtags}>
                            {(hashtag) => {
                                return (
                                    <SearchResultHashtag hashtag={hashtag} />
                                );
                            }}
                        </For>
                        <For each={results()?.statuses}>
                            {(status) => {
                                return (
                                    <li>
                                        <PreprocessedPost
                                            status={wrapUnprocessedStatus(
                                                status
                                            )}
                                            limitInitialHeight={true}
                                        />
                                    </li>
                                );
                            }}
                        </For>
                    </ul>
                </div>
            </Match>
        </Switch>
    );
};

const SearchResultAccount: Component<{ account: Account }> = (props) => {
    return (
        <a
            class="pbCard p-4 flexRow"
            href={`/user/${props.account.acct}`}
            style="margin: 1em !important;"
        >
            <AvatarImage user={props.account} imgClass="size-14" />
            <div style="flex: 1">
                <p>{props.account.display_name}</p>
                <p>@{props.account.acct}</p>
            </div>
        </a>
    );
};

const SearchResultHashtag: Component<{ hashtag: Tag }> = (props) => {
    return (
        <a href={props.hashtag.url} class="underline">
            #{props.hashtag.name}
        </a>
    );
};

export default SearchFacet;

# contributing

thanks for your interest in contributing to pillbug! here's some information i think is useful for getting started.

## project goals during pre-alpha phase

- build out the basic core functionality so that someone could use pillbug without *needing* to switch to another client to do something that isn't implemented in pillbug yet.
- project structure is intentionally haphazard at the moment. i am not especially attached to the way things are structured at the moment, as long as it works. the intent is to do small refactorings as needed until pre-alpha feature complete, at which point we can revisit the question of project structure with a clear view of all the parts involved.
  - contributors are welcome to refactor and move things around, but please keep in mind the above and try to limit the amount of time and effort spent until later - also, consider waiting to undertake refactorings that will require significant time and effort from other contributors to align to - these will be handled on a case-by-case basis
- learn the features of solidjs
  - this is not a project where i'm expecting folks to come in already having relevant knowledge. *I'm* learning solidjs as I go too.
- have fun working on it. this is a passion project i'm working on in my free time

### overall vision

pillbug's a client for gotosocial and other mastodon api-compatible servers that aims to implement a cohost-inspired posting experience.

## major technology choices

- [megalodon](https://h3poteto.github.io/megalodon/) is the client library we use to talk to mastodon-api-compliant servers
  - we may make api calls manually outside of megalodon if there is reason to, but prefer not to.
  - megalodon's docs are a little sparse. you may want to refer to [mastodon's api docs](https://docs.joinmastodon.org/) too.
- [solidjs](https://www.solidjs.com/)
- we *use* [tailwindcss](https://tailwindcss.com/) but it is not mandatory or the long-term intent.
  - why? tailwind allows quick iteration without having to settle on a class taxonomy or inlining css in style elements.
    - having to define a class taxonomy early encodes details about element structure in two places: jsx *and* css. this makes iterating just a little bit slower. it also means more pressure to come up with a 'correct' taxonomy lest you get it wrong and paint yourself into a corner.
    - tailwind narrows the scope of what css that could be used to solve a given problem, which i think reduces overwhelming choice early on somewhat. this might be kinda moot because it's already kind of clear: most things are flex. you're welcome to inline css in style elements if you'd prefer.
- we use typescript to shift part of the process of finding problems to be before runtime.
  - please try to avoid the use of `any`, defining types where possible
- vite is used for bundling simply because it works and was in the template
- npm is the package manager for no particular reason other than "it's there"
- some components are from [solidui](https://www.solid-ui.com/) since they were convenient unblockers, but we may or may not keep them.
- a bunch of icons are provided by [solid-icons](https://solid-icons.vercel.app/).
- [solid-router](https://github.com/solidjs/solid-router) is used to map urls to different components in pillbug

## workflow

- fork the repo, make changes in your fork, and open pull requests.
- for changes that don't impact big chunks of the repo, feel free to open prs without asking. if you aren't sure, feel free to reach out or create an issue to discuss.
- realtime discussion takes place in the [website league](https://websiteleague.org)'s [zulip instance](https://coordination.websiteleague.org/) but you are welcome to contribute without being there.
- viv may leave feedback on your pr with suggestions or thoughts but if there's an approval, you don't need to act on those before merging. please merge your own prs to main when you are ready.
- when changes are pushed to main, a github action will run to deploy them at <https://pillbug.vivl.im>
- when prs are made on the repo, a github action will deploy them to a temporary domain allowing others to try out your changes without building them themselves. (this doesn't work atm for pull requests originating from forks)
- issues may be filed while missing information if you think of something that should be tracked or otherwise want input on.

## getting started

1. clone the repo.
2. `npm i` to install dependencies
3. `npm run dev` to build and run pillbug locally.
4. (optional) if you are in vscode you can launch edge with the debugger attached using the "launch edge" profile. feel free to add other profiles for other browsers.

## tips

these tips might be out of date depending on when you read them. feel free to update them as things change

- all of the authentication code is currently spread across app.tsx, login.tsx, and auth-context.ts.
  - i wrote that first while using solidjs for the first time, so it is definitely not making use of solidjs idioms like Resource
- to get access to an authenticated megalodon client, use the function `useAuthContext()` *from within a component*. [Contexts](https://docs.solidjs.com/concepts/context) allow us to access global-ish state without having to thread it through each component in the hierarchy.
  - if you try to access useAuthContext() outside of a component, it will fail. if you need it inside an async function you might need to pass the context in as an argument (this is what i've been doing in most places)
  - try to keep things related to calling authenticated api endpoints within auth context; in the future there will be the ability to switch between auth contexts so that we can support switching between multiple accounts
    - auth state is stored persistently by `makePersisted(createStore({})`, which creates a [Store](https://docs.solidjs.com/concepts/stores) that is stored persistently in browser local storage (via `@solid-primitives/storage`)
- async work is done using Resources, see [this doc](https://docs.solidjs.com/guides/fetching-data) for a overview (or look at, say, `postpage.tsx`)
- the main feed's pagination might be a useful example for doing pagination generally (though it's not perfect)
- you can view post and notification raw json by right clicking the bottom widget on posts, or a notification. feel free to add more ways to view raw json as seems appropriate.

## feedback

if you have any questions, comments, or concerns about anything in here please open an issue and/or reach out on zulip.

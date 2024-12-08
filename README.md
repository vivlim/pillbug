## pillbug

in-progress cohost-inspired client for fediverse servers, particularly gotosocial.

to try it, you'll need an account on a compatible activitypub server; go to <https://pillbug.vivl.im> where you can log into it.

### server software support

#### known working

(currently, in order of how much testing I've personally done on them)

- [GoToSocial](https://gotosocial.org/)
- [Mastodon](https://joinmastodon.org/)
- [Akkoma](https://akkoma.social/)

#### known incompatible servers

- [Sharkey](https://joinsharkey.org/): cannot log in, see <https://github.com/vivlim/pillbug/issues/92>

#### unknown compatibility

- anything else; if you try another server please [open an issue](https://github.com/vivlim/pillbug/issues/new) with your findings

### other environments
if you're feeling adventurous, you can try different versions of pillbug. each of these have separate state in your browser, so you will need to log in to each of them individually.

- [production (https://pillbug.vivl.im)](https://pillbug.vivl.im): production environment
- [staging](https://gray-water-0add53f1e-staging.westus2.5.azurestaticapps.net): testing larger changes before rolling them out to production. in this environment, pillbug should *more or less* work okay, there might be issues that aren't present in production.
- [dev](https://gray-water-0add53f1e-dev.westus2.5.azurestaticapps.net): unstable branch where active development is happening, things may be broken

note: the `gray-water-0add53f1e-*.westus2.5.azurestaticapps.net` domains are a generated name provided by azure static web apps. i unfortunately can't change the `gray-water-0add53f1e` part of the name without deleting and setting that up again.

---

## developer instructions

below this point are instructions for developers. currently they're mostly from an app template and I haven't updated them

## Usage

```bash
npm install 
```

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## components

some components from here are used
<https://www.solid-ui.com/docs/components/flex>

# darktalk [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL]

Simple [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)-based replacement of native Alert, Confirm and Prompt.

# Install

```
npm i darktalk
```

# API

First things first, require `darktalk` with:

```js
const darktalk = require("darktalk");
```

````
When you need a bundled verseion use

```js
import darktalk from "darktalk/bundle";
````

In every method of `darktalk` last parameter _options_ is optional and could be used
to prevent handling of cancel event and to specify custom button label.

```js
({
  cancel: true /* default */,
});
```

## darktalk.alert(title, message [, options])

```js
darktalk.alert("Error", "There was an error!").then(() => {
  console.log("ok");
});
```

## darktalk.confirm(title, message [, options])

```js
darktalk
  .confirm("Question", "Are you sure?")
  .then(() => {
    console.log("yes");
  })
  .catch(() => {
    console.log("no");
  });
```

## darktalk.prompt(title, message, value [, options])

```js
darktalk
  .prompt("Question", "How old are you?", "10")
  .then((value) => {
    console.log(value);
  })
  .catch(() => {
    console.log("cancel");
  });
```

Use `type='password'` for `password` fields:

```js
darktalk
  .prompt("Question", "How old are you?", "10", {
    type: "password",
  })
  .then((value) => {
    console.log(value);
  })
  .catch(() => {
    console.log("cancel");
  });
```

## darktalk.progress(title, message)

```js
const progress = darktalk.progress(
  "Cloud Commander",
  "Copy /home/coderaiser -> /home/coderaiser/2"
);

progress.setProgress(41).catch(() => {
  console.log("abort");
});
```

## Custom label

You can use custom label passing into options param the buttons specification. For example :

```js
const tryToCatch = require("try-to-catch");
const OK = 2;
const result = await tryToCatch(darktalk.confirm, "Question", "Are you sure?", {
  buttons: {
    ok: "Ok Label",
    cancel: "Cancel Label",
  },
});

if (result.length === OK) console.log("yes");
else console.log("no");
```

# License

MIT

[NPMIMGURL]: https://img.shields.io/npm/v/darktalk.svg?style=flat&longCache=true
[LicenseIMGURL]: https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat&longCache=true
[NPMURL]: https://npmjs.org/package/darktalk "npm"
[LicenseURL]: https://tldrlegal.com/license/mit-license "MIT License"

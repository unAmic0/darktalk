"use strict";

require("../css/darktalk.css");

const currify = require("currify");
const store = require("fullstore");
const createElement = require("@cloudcmd/create-element");
const DOMPurify = require("dompurify");
const purifier = DOMPurify.default || DOMPurify;

const isBool = (a) => typeof a === "boolean";

const keyDown = currify(keyDown_);

const BUTTON_OK = {
  ok: "OK",
};

const BUTTON_OK_CANCEL = {
  ok: "OK",
  cancel: "Cancel",
};

const zIndex = store(100);

module.exports.alert = (title, msg, options) => {
  const buttons = getButtons(options) || BUTTON_OK;
  return showDialog(title, msg, "", buttons, options);
};

module.exports.prompt = (title, msg, value = "", options) => {
  const type = getType(options);
  const val = String(value).replace(/"/g, "&quot;");

  const valueStr = `<input type="${type}" value="${val}" data-name="js-input">`;
  const buttons = getButtons(options) || BUTTON_OK_CANCEL;

  return showDialog(title, msg, valueStr, buttons, options);
};

module.exports.confirm = (title, msg, options) => {
  const buttons = getButtons(options) || BUTTON_OK_CANCEL;

  return showDialog(title, msg, "", buttons, options);
};

module.exports.progress = (title, message, options) => {
  const valueStr = `
        <progress value="0" data-name="js-progress" class="progress" max="100"></progress>
        <span data-name="js-counter">0%</span>
    `;

  const buttons = {
    cancel: "Abort",
  };

  const promise = showDialog(title, message, valueStr, buttons, options);
  const { ok, dialog } = promise;
  const resolve = ok();

  for (const el of find(dialog, ["cancel"])) {
    el.focus();
  }

  Object.assign(promise, {
    setProgress(count) {
      const [elProgress] = find(dialog, ["progress"]);
      const [elCounter] = find(dialog, ["counter"]);

      elProgress.value = count;
      elCounter.textContent = `${count}%`;

      if (count === 100) {
        remove(dialog);
        resolve();
      }
    },

    remove() {
      remove(dialog);
    },
  });

  return promise;
};

function getButtons(options = {}) {
  const { buttons } = options;

  if (!buttons) return null;

  return buttons;
}

function getType(options = {}) {
  const { type } = options;

  if (type === "password") return "password";

  return "text";
}

function getTemplate(title, msg, value, buttons) {
  const encodedMsg = purifier.sanitize(msg).replace(/\n/g, "<br>");

  return `<main class="page">
        <header>${purifier.sanitize(title)}</header>
        <div class="content-area">${encodedMsg}${purifier.sanitize(value)}</div>
        <div class="action-area">
            <div class="button-strip">
                ${purifier.sanitize(parseButtons(buttons))}
            </div>
        </div>
    </main>`;
}

function parseButtons(buttons) {
  const names = Object.keys(buttons);
  const parse = currify(
    (buttons, name) => `<button
            data-name="js-${purifier.sanitize(name).toLowerCase()}">
            ${purifier.sanitize(buttons[name])}
        </button>`,
  );

  return names.map(parse(buttons)).join("");
}

function showDialog(title, msg, value, buttons, options) {
  const ok = store();
  const cancel = store();

  const closeButtons = ["cancel", "ok"];

  const promise = new Promise((resolve, reject) => {
    const noCancel = options && isBool(options.cancel) && !options.cancel;
    const empty = () => { };
    const rejectError = () => reject(Error());

    ok(resolve);
    cancel(noCancel ? empty : rejectError);
  });

  const innerHTML = getTemplate(title, msg, value, buttons);

  const dialog = createElement("div", {
    innerHTML,
    className: "darktalk",
    style: `z-index: ${zIndex(zIndex() + 1)}`,
  });

  for (const el of find(dialog, ["ok", "input"])) el.focus();

  for (const el of find(dialog, ["input"])) {
    el.setSelectionRange(0, value.length);
  }

  addListenerAll("click", dialog, closeButtons, (event) => {
    closeDialog(event.target, dialog, ok(), cancel());
  });

  for (const event of ["click", "contextmenu"])
    dialog.addEventListener(event, (e) => {
      e.stopPropagation();

      for (const el of find(dialog, ["ok", "input"])) el.focus();
    });

  dialog.addEventListener("keydown", keyDown(dialog, ok(), cancel()));

  return Object.assign(promise, {
    dialog,
    ok,
  });
}

function keyDown_(dialog, ok, cancel, event) {
  const KEY = {
    ENTER: 13,
    ESC: 27,
    TAB: 9,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  };

  const { keyCode } = event;
  const el = event.target;

  const namesAll = ["ok", "cancel", "input"];
  const names = find(dialog, namesAll).map(getDataName);

  switch (keyCode) {
    case KEY.ENTER:
      closeDialog(el, dialog, ok, cancel);
      event.preventDefault();
      break;

    case KEY.ESC:
      remove(dialog);
      cancel();
      break;

    case KEY.TAB:
      if (event.shiftKey) tab(dialog, names);

      tab(dialog, names);
      event.preventDefault();
      break;

    default:
      ["left", "right", "up", "down"]
        .filter((name) => keyCode === KEY[name.toUpperCase()])
        .forEach(() => {
          changeButtonFocus(dialog, names);
        });

      break;
  }

  event.stopPropagation();
}

function getDataName(el) {
  return el.getAttribute("data-name").replace("js-", "");
}

const getName = (activeName) => {
  if (activeName === "cancel") return "ok";

  return "cancel";
};

function changeButtonFocus(dialog, names) {
  const active = document.activeElement;
  const activeName = getDataName(active);
  const isButton = /ok|cancel/.test(activeName);
  const count = names.length - 1;

  if (activeName === "input" || !count || !isButton) return;

  const name = getName(activeName);

  for (const el of find(dialog, [name])) {
    el.focus();
  }
}

const getIndex = (count, index) => {
  if (index === count) return 0;

  return index + 1;
};

function tab(dialog, names) {
  const active = document.activeElement;
  const activeName = getDataName(active);
  const count = names.length - 1;

  const activeIndex = names.indexOf(activeName);
  const index = getIndex(count, activeIndex);

  const name = names[index];

  for (const el of find(dialog, [name])) el.focus();
}

function closeDialog(el, dialog, ok, cancel) {
  const name = el.getAttribute("data-name").replace("js-", "");

  if (/close|cancel/.test(name)) {
    cancel();
    remove(dialog);

    return;
  }

  let value = null;

  for (const el of find(dialog, ["input"])) {
    value = el.value;
  }

  ok(value);
  remove(dialog);
}

const query = currify((element, name) =>
  element.querySelector(`[data-name="js-${purifier.sanitize(name)}"]`),
);

function find(element, names) {
  const elements = names.map(query(element)).filter(Boolean);

  return elements;
}

function addListenerAll(event, parent, elements, fn) {
  for (const el of find(parent, elements)) {
    el.addEventListener(event, fn);
  }
}

function remove(dialog) {
  const { parentElement } = dialog;

  if (parentElement) parentElement.removeChild(dialog);
}

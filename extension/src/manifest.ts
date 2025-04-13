import { version } from "../package.json"

const __DEV__ = process.env.NODE_ENV == "development"
const __FIREFOX__ = process.env.BROWSER == "firefox"
const __OPERA__ = process.env.BROWSER == "opera"

export const browser = process.env.BROWSER || "chrome"

/** Manually register in the service worker */
export const contentScript = {
  id: "content",
  matches: ["<all_urls>"],
  js: ["js/content.js"],
  runAt: "document_start",
} satisfies chrome.scripting.RegisteredContentScript

export const contentMainScript = {
  id: "main",
  js: ["js/content-main.js"],
  runAt: "document_start",
  ...(__FIREFOX__ ? {} : { world: "MAIN" }),
  matches: ["<all_urls>"],
} satisfies chrome.scripting.RegisteredContentScript

// export const allFrameScript = {
//   id: ContentScriptId.frame,
//   js: ["js/content-frame.js"],
//   allFrames: true,
//   runAt: "document_start",
//   matches: ["<all_urls>"],
// } satisfies chrome.scripting.RegisteredContentScript

export const defaultSidebarPath = "sidebar.html"
export const defaultPopupPath = "popup.html"

export default /* @__PURE__ */ (() => ({
  // maximum of 45 characters // 75
  name: "__MSG_name__",
  version: version,
  // edge 12 characters
  // short_name: "__MSG_short_name__",
  // no more than 132 characters
  description: "__MSG_description__",
  manifest_version: 3,
  default_locale: "en",
  action: {
    default_icon: {
      16: "img/logo.png",
      24: "img/logo.png",
      32: "img/logo.png",
    },
    default_title: "__MSG_short_name__",
    default_popup: defaultPopupPath,
  },
  icons: {
    16: "img/logo.png",
    32: "img/logo.png",
    48: __DEV__ ? "/img/logo.png" : "img/logo.png",
    128: __DEV__ ? "/img/logo.png" : "img/logo.png",
  },
  background: __FIREFOX__
    ? {
        scripts: ["js/bg.js"],
      }
    : {
        service_worker: "js/bg.js",
        type: "module" as const,
      },
  content_scripts: [
    // {
    //   matches: ["<all_urls>"],
    //   js: ["src/content/main.ts"],
    //   run_at: "document_start",
    //   world: "MAIN",
    // },
    // {
    //   matches: ["<all_urls>"],
    //   js: ["js/content.js"],
    //   run_at: "document_start",
    // },
  ],
  options_page: "options.html",
  // side_panel: {
  //   default_path: defaultSidebarPath,
  // },
  permissions: [
    "tabs",
    "scripting",
    "activeTab",
    "storage",
    "offscreen",
    "sidePanel",
    "contextMenus",
    "search",
    "notifications",
    "tabCapture",
    "downloads",
    // "declarativeNetRequestWithHostAccess",
    // "cookies",
    __OPERA__ ? "opera://favicon" : "favicon",
    ...(__DEV__ ? (["declarativeNetRequestFeedback"] as const) : []),
  ],
  optional_permissions: ["bookmarks", "readingList", "management"],
  host_permissions: ["<all_urls>"],
  minimum_chrome_version: "111",
  web_accessible_resources: [
    {
      resources: ["logo.svg"],
      matches: ["<all_urls>"],
      use_dynamic_url: false,
      // use_dynamic_url: true,
    },
  ],
  content_security_policy: {
    extension_pages: __DEV__
      ? `script-src 'self' http://localhost:5172 'wasm-unsafe-eval';`
      : `script-src 'self' 'wasm-unsafe-eval'`,
  },
}))()

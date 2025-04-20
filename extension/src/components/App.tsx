import i18n from "i18next"
import AntdProvider from "@/components/antd/AntdProvider"
import { PropsWithChildren } from "react"
import { initReactI18next } from "react-i18next"
import HttpApi, { HttpBackendOptions } from "i18next-http-backend"
import { locales } from "@ziziyi/utils"
import { getLocale } from "@/utils/i18n"

import "@/assets/main.css"

i18n
  .use(initReactI18next)
  .use(HttpApi)
  .init<HttpBackendOptions>({
    resources: {},
    backend: {
      loadPath: "/locales/{{lng}}.json",
      request: (options, url, payload, callback) => {
        console.log(url)
        if (typeof payload === "function") {
          callback = payload as typeof callback
          payload = undefined
        }
        callback = callback || (() => {})
        fetch(chrome.runtime.getURL(url))
          .then(async (res) => {
            callback(null, { status: res.status, data: await res.json() })
          })
          .catch((err) => callback(err, null))
      },
    },
    partialBundledLanguages: true,
    supportedLngs: locales,
    lng: getLocale(),
  })

export default function App({ children }: PropsWithChildren) {
  return <AntdProvider>{children}</AntdProvider>
}

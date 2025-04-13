import { useState, useEffect } from "react"
import { getLocal, getSession } from "@/utils/ext"

type Options = {
  session?: boolean
}

export default function useStorage<T extends Record<string, any>>(
  keys: T,
  options?: Options
) {
  const [data, setData] = useState(keys)

  const storageArea = options?.session
    ? chrome.storage.session
    : chrome.storage.local

  useEffect(() => {
    const initializeData = async () => {
      const value = options?.session
        ? await getSession(keys)
        : await getLocal(keys)
      setData((prevData) => ({
        ...prevData,
        ...value,
      }))
    }

    initializeData()

    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      for (const key in changes) {
        if (key in keys) {
          setData((prevData) => ({
            ...prevData,
            [key]: changes[key].newValue ?? keys[key],
          }))
        }
      }
    }

    storageArea.onChanged.addListener(listener)
    return () => {
      storageArea.onChanged.removeListener(listener)
    }
  }, [])

  return data
}

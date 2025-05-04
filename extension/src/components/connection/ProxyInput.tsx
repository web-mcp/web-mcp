import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input as AntInput, Select as AntSelect, Tooltip } from "antd"

type Props = {
  value?: string
  disabled?: boolean
  placeholder?: string
  onChange?: (value: string) => void
}

export default function ProxyInput({
  value,
  disabled,
  placeholder,
  onChange,
}: Props) {
  const { t } = useTranslation()

  const handleSelectChange = (value: string) => {
    if (disabled) return
    onChange?.(value)
  }

  const selectAfter = (
    <AntSelect
      // defaultOpen
      value={null}
      labelRender={() => null}
      onChange={handleSelectChange}
      popupMatchSelectWidth={false}
      dropdownStyle={{ maxHeight: "80vh", maxWidth: "80vw" }}
      suffixIcon={<ChevronDown className="size-5" />}
      options={[
        {
          label: t("localService"),
          options: [
            {
              label: "http://localhost:6288/web/sse",
              value: "http://localhost:6288/web/sse",
            },
          ],
        },
        {
          label: t("officialService"),
          options: [
            {
              label: "https://web-mcp.onrender.com/web/sse",
              value: "https://web-mcp.onrender.com/web/sse",
            },
            {
              label: "https://web-mcp.koyeb.app/web/sse",
              value: "https://web-mcp.koyeb.app/web/sse",
            },
          ],
        },
        {
          label: t("communityService"),
          options: [
            {
              disabled: true,
              label: t("comingSoon"),
              value: "-",
            },
            // {
            //   label: "Offical Onrender Server",
            //   value: "https://xxx.xxx.com/",
            // },
          ],
        },
      ]}
    />
  )

  return (
    <AntInput
      size="large"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      addonAfter={selectAfter}
    />
  )
}

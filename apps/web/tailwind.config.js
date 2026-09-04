import { colors as customColors } from "./src/components/tokens/colors" // ajuste o caminho conforme necessário

const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: customColors.cyan["700"],
        "brand-medium": customColors.cyan["700"],
        active: customColors.cyan["900"],
        primary: customColors.neutral["800"],
        tertiary: customColors.neutral["500"],
        muted: customColors.neutral["300"],
      },
      gridTemplateColumns: {
        app: "322px 1fr",
      },
      boxShadow: {
        "custom-lg": "0px 8px 20px 0px #1847460D",
        "custom-sm": "0px 1px 2px 0px #1847460D",
      },
    },
  },
  plugins: [],
}

export default config

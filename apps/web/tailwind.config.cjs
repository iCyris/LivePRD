const path = require("node:path");

module.exports = {
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{js,jsx}"),
    path.join(__dirname, "../../demos/**/*.{js,jsx}")
  ],
  theme: {
    extend: {
      colors: {
        prd: {
          surface: "var(--prd-surface)",
          panel: "var(--prd-panel)",
          text: "var(--prd-text)",
          muted: "var(--prd-muted)",
          primary: "var(--prd-primary)",
          border: "var(--prd-border)"
        }
      },
      borderRadius: {
        prd: "var(--prd-radius)"
      },
      boxShadow: {
        prd: "var(--prd-shadow)"
      }
    }
  },
  plugins: []
};

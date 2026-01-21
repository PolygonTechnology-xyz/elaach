import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

const planeTheme = create({
  base: "dark",
  brandTitle: "Plane UI",
  brandUrl: "",
  brandImage: "",
  brandTarget: "_self",
});

addons.setConfig({
  theme: planeTheme,
});

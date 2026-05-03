import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // register custom components here
  }
} satisfies Theme;

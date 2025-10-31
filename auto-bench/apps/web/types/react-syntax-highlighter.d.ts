declare module "react-syntax-highlighter" {
  export const LightAsync: any;
  export const PrismAsyncLight: any;
  export const PrismLight: any;
  export const Prism: any;
  const SyntaxHighlighter: any;
  export default SyntaxHighlighter;
}

declare module "react-syntax-highlighter/dist/cjs/styles/prism" {
  export const dracula: any;
  const styles: Record<string, any>;
  export default styles;
}

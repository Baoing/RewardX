declare module "*.css"

// Shopify App Bridge Web Components
declare namespace JSX {
  interface IntrinsicElements {
    "s-app-window": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        id?: string
        src?: string
        ref?: React.Ref<any>
      },
      HTMLElement
    >
    "s-page": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        heading?: string
      },
      HTMLElement
    >
    "s-button": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        command?: string
        commandFor?: string
        slot?: string
      },
      HTMLElement
    >
  }
}

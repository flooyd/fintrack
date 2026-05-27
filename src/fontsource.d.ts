// Fontsource packages are CSS-only side-effect imports and ship no type
// declarations. This ambient (non-module) file lets TypeScript resolve the
// bare `@fontsource-variable/*` specifiers used in the root layout.
declare module '@fontsource-variable/*';

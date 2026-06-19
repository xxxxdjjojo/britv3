// Ambient declaration for Vite/Vitest `?raw` imports, which load a module's
// source as a string. Used by tests that assert on a component's source text.
declare module "*?raw" {
  const content: string;
  export default content;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get URL parameters.
       * @returns {Promise<{ projectName: string, hostname: string }>} An object with projectName and hostname properties.
       */
      getUrlParams(): Promise<{ projectName: string; hostname: string }>;
      /**
       * Custom command to get the Monaco Editor instance.
       * @returns {Promise<monaco.editor.ITextModel>} A Promise that resolves with the Monaco Editor instance.
       */
      getMonacoEditorInstance(): Promise<unknown>;
    }
  }
}

// Add this line to the end of types.ts
export {};

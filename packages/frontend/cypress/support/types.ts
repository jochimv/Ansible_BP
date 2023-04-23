declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get URL parameters.
       * @returns {Promise<{ projectName: string, hostname: string }>} An object with projectName and hostname properties.
       */
      getUrlParams(): Promise<{ projectName: string; hostname: string }>;
    }
  }
}

export {};

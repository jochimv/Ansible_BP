/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

// @ts-ignore
Cypress.Commands.add('getUrlParams', () => {
  return cy.url().then((url: string) => {
    const urlParts = url.split('/');
    const projectName = urlParts[3];
    const hostname = urlParts[5];

    return { projectName, hostname };
  });
});

export {};

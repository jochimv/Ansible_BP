describe('commands page', () => {
  beforeEach(() => {
    cy.intercept(`http://127.0.0.1:4000/projects`, {
      fixture: 'projectHosts.json',
    }).as('fetchProjectsHosts');
    cy.visit('http://localhost:3000');
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#button-commands').click();
    });
  });
});

export {};

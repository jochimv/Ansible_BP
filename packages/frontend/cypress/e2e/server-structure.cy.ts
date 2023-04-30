/// <reference types="cypress" />

describe('ProjectDetailsTree', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://127.0.0.1:4000/*/details', {
      fixture: 'project-details.json',
    }).as('fetchProjectDetails');

    cy.intercept(`http://127.0.0.1:4000/projects-hosts`, {
      fixture: 'projectHosts.json',
    }).as('fetchProjectsHosts');

    cy.visit('http://localhost:3000');

    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#button-server-structure').click();
    });
    cy.wait('@fetchProjectDetails');
  });

  it('displays tree items correctly', () => {
    cy.get('.MuiTreeView-root').find('.MuiTreeItem-root').should('have.length', 4);
  });

  it('filters tree items based on the search term', () => {
    cy.get('#search').type('prod');
    cy.get('.MuiTreeView-root').find('.MuiTreeItem-root').should('have.length', 3);
  });
});

export {};

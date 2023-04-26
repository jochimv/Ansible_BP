describe('Home page', () => {
  beforeEach(() => {
    cy.intercept(`http://127.0.0.1:4000/projects-hosts`, {
      fixture: 'projectHosts.json',
    }).as('fetchProjectsHosts');

    cy.visit('http://localhost:3000');
  });

  it('searches for a project', () => {
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#projects').should('have.value', projectName);
    });
  });

  it('searches for a server', () => {
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      const server: string = response?.body[0]?.hosts[0];

      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#servers').type(server).type('{downarrow}').type('{enter}');
      cy.url().should('include', `/${projectName}/host/${server}`);
    });
  });

  it('opens import repository modal', () => {
    cy.get('button').contains('Import repository').click();
    cy.get('[role="presentation"]').should('be.visible');
  });

  it('opens delete repository confirm dialog', () => {
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;

      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('button').contains('Delete selected repository').click();
      cy.get('[role="presentation"]').should('be.visible');
    });
  });
});

export {};

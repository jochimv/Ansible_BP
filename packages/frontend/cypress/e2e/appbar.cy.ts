describe('Appbar', () => {
  beforeEach(() => {
    cy.intercept(`http://127.0.0.1:4000/projects-hosts`, {
      fixture: 'projectHosts.json',
    }).as('fetchProjectsHosts');
    cy.visit('http://localhost:3000');
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
    });
  });

  it('should disable navigation buttons if project is not selected', () => {
    cy.get('[aria-label="Clear"]').click(); // Click the clear button inside Autocomplete component
    cy.get('#projects').should('have.value', '');

    cy.get('#button-git').click();
    cy.url().should('not.include', '/git');

    cy.get('#button-dashboard').click();
    cy.url().should('not.include', '/dashboard');

    cy.get('#button-commands').click();
    cy.url().should('not.include', '/commands');

    cy.get('#button-overview').click();
    cy.url().should('not.include', '/overview');
  });
  it('should navigate to Dashboard', () => {
    cy.get('#button-dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to Commands', () => {
    cy.get('#button-commands').click();
    cy.url().should('include', '/commands');
  });

  it('should navigate to Git', () => {
    cy.get('#button-git').click();
    cy.url().should('include', '/git');
  });

  it('should navigate to Search', () => {
    cy.get('#button-search').click();
    cy.url().should('eq', 'http://localhost:3000/');
  });

  it('should open Clear Modal when Clear button is clicked', () => {
    cy.get('#button-clear').click();
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('should navigate to Overview', () => {
    cy.get('#button-overview').click();
    cy.url().should('include', '/overview');
  });

  it('should toggle between Edit mode and Read mode', () => {
    cy.get('#button-mode').click();
    cy.get('#button-mode').should('have.text', 'Edit mode');

    cy.get('#button-mode').click();
    cy.get('#button-mode').should('have.text', 'Read mode');
  });
});

export {};

describe('Appbar', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should navigate to Dashboard', () => {
    cy.get('#button-dashboard').click();
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to Commands', () => {
    cy.get('#button-runner').click();
    cy.url().should('include', '/commands');
  });

  it('should navigate to Git', () => {
    cy.get('#button-git').click();
    cy.url().should('include', '/git');
  });

  it('should navigate to Overview', () => {
    cy.get('#button-overview').click();
    cy.url().should('include', '/overview');
  });

  it('should navigate to Search', () => {
    cy.get('#button-search').click();
    cy.url().should('eq', 'http://localhost:3000/');
  });

  it('should open Clear Modal when Clear button is clicked', () => {
    cy.get('#button-clear').click();
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('should toggle between Edit mode and Read mode', () => {
    cy.get('#button-mode').click();
    cy.get('#button-mode').should('have.text', 'Edit mode');

    cy.get('#button-mode').click();
    cy.get('#button-mode').should('have.text', 'Read mode');
  });
});

export {};

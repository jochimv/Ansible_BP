/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

describe('Dashboard', () => {
  const projectName = 'jochimz';
  beforeEach(() => {
    cy.intercept('GET', `http://127.0.0.1:4000/${projectName}/command-executions`, {
      fixture: 'command-execution.json',
    }).as('commandExecutions');

    cy.intercept('GET', `http://127.0.0.1:4000/${projectName}/exists`, {
      fixture: 'project-exists.json',
    }).as('projectExists');

    cy.visit(`http://localhost:3000/${projectName}/dashboard`);
    cy.wait('@commandExecutions');
  });

  it('loads and displays the dashboard', () => {
    cy.get('.recharts-responsive-container').should('be.visible');
    cy.get('.MuiTableContainer-root').should('be.visible');
  });

  it('displays the correct number of command executions', () => {
    cy.get('.MuiTableBody-root').find('.MuiTableRow-root').should('have.length', 2);
  });

  it('displays the output dialog when the terminal icon is clicked', () => {
    cy.get('#button-show-output').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('#terminal').should('be.visible');
  });

  it('closes the output dialog when the background is clicked', () => {
    cy.get('#button-show-output').click();
    cy.get('.MuiDialog-root').should('be.visible');
    cy.get('.MuiBackdrop-root').click({ force: true });
    cy.get('.MuiDialog-root').should('not.exist');
  });
});

export {};

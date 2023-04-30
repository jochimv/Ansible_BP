/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

describe('commands page', () => {
  const addCommand = () => {
    cy.get('#button-add-command').click();
    cy.get('#textfield-alias').type('ping google').type('{enter}');
    cy.get('#autocomplete-playbooks').click().type('{downarrow}').type('{enter}');
    cy.get('#autocomplete-inventory-type').click().type('{downarrow}').type('{enter}');
    cy.get('#autocomplete-groups').click().type('{downarrow}').type('{enter}');
    cy.get('#button-add').should('not.be.disabled');
    cy.get('#button-add').click();
  };
  beforeEach(() => {
    cy.intercept(`http://127.0.0.1:4000/projects-hosts`, {
      fixture: 'projectHosts.json',
    }).as('fetchProjectsHosts');
    cy.intercept(`http://127.0.0.1:4000/jochimz/details-playbooks`, {
      fixture: 'detailsPlaybooks.json',
    });
    cy.intercept('GET', `http://127.0.0.1:4000/jochimz/exists`, {
      fixture: 'project-exists.json',
    });
    cy.visit('http://localhost:3000');
    cy.wait('@fetchProjectsHosts').then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#button-commands').click();
    });
  });

  it('should run a command', () => {
    const mockResponse = {
      success: true,
      output: 'Command output',
    };
    cy.intercept('POST', `http://127.0.0.1:4000/run-command`, mockResponse).as('runCommand');
    addCommand();
    cy.get('.MuiTableBody-root').find('tr').should('have.length', 1);
    cy.get('#run-command-0').should('exist');
    cy.get('#run-command-0').click();
    cy.wait('@runCommand').then(({ response }) => {
      expect(response?.statusCode).to.equal(200);
      expect(response?.body).to.deep.equal(mockResponse);
    });
  });

  it('should edit a command', () => {
    addCommand();
    cy.get(`#edit-command-0`).click();
    const newCommandAlias = 'ping microsoft';
    cy.get('#textfield-alias').clear().type(newCommandAlias).type('{enter}');
    cy.get('#button-add').click();
    cy.get('#command-0-alias').should('contain', newCommandAlias);
  });
  it('should add a command', () => {
    addCommand();
    cy.get('#command-0').should('exist');
  });
  it('should delete a command', () => {
    addCommand();
    cy.get(`#delete-command-0`).click();
    cy.get('#command-0').should('not.exist');
  });
});

export {};

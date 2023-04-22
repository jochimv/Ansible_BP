describe('Host Details Page', () => {
  const goToHostDetailsPage = () => {
    cy.wait('@fetchProjectsHosts', { timeout: 10000 }).then(({ response }) => {
      const projectName = response?.body[0]?.project;
      const server = response?.body[0]?.hosts[0];

      cy.intercept(`http://127.0.0.1:4000/${projectName}/${server}`, {
        fixture: 'hostDetails.json',
      }).as('fetchHostDetails');

      cy.get('#projects').type(projectName).type('{downarrow}').type('{enter}');
      cy.get('#servers').type(server).type('{downarrow}').type('{enter}');
    });
  };

  beforeEach(() => {
    cy.intercept('GET', 'http://127.0.0.1:4000/projects', { fixture: 'projectHosts.json' }).as(
      'fetchProjectsHosts',
    );

    cy.visit('http://localhost:3000');
    goToHostDetailsPage();
  });

  it('Should fetch host details correctly', () => {
    cy.wait('@fetchHostDetails').then(({ response }) => {
      const { statusCode, body } = response;

      expect(statusCode).to.eq(200);
      expect(body).to.have.property('hostDetailsByInventoryType');
      expect(body).to.have.property('hostExists', true);
      expect(body).to.have.property('projectExists', true);
    });
  });

  it('Should display all buttons correctly', () => {
    cy.wait('@fetchHostDetails').then(({ response }) => {
      const { body } = response;
      const { hostDetailsByInventoryType } = body;

      hostDetailsByInventoryType.forEach((hostDetails) => {
        const { inventoryType, variables } = hostDetails;
        cy.get(`#inventory-button-${inventoryType}`).should('exist');
        variables.forEach((variable) => {
          const { type } = variable;
          cy.get(`#variables-button-${type}`).should('exist');
        });
      });
    });
  });

  it('Should display all data correctly', () => {
    cy.wait('@fetchHostDetails').then(({ response }) => {
      const { body } = response;
      const { hostDetailsByInventoryType } = body;

      hostDetailsByInventoryType.forEach(({ inventoryType, groupName }) => {
        cy.get(`#inventory-button-${inventoryType}`).then(($button) => {
          if (!$button.is(':disabled')) {
            $button.click();
          }

          cy.getUrlParams().then(({ projectName, hostname }) => {
            cy.get('#project-name-label').should('have.text', projectName);
            cy.get('#group-name-label').should('have.text', groupName);
            cy.get('#hostname-label').should('have.text', hostname);
          });
        });
      });
    });
  });

  it('Applied variables should be chosen first', () => {
    cy.get('#variables-button-applied').should('be.disabled');
  });

  it('Applied variables should be read only', () => {
    cy.get('.MuiSnackbar-root').should('exist');
  });
});

export {};

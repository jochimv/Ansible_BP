import { HostVariable } from '@frontend/utils/types';
import { Interception } from 'cypress/types/net-stubbing';

describe('Host Details Page', () => {
  const goToHostDetailsPage = () => {
    cy.wait('@fetchProjectsHosts', { timeout: 10000 }).then(({ response }) => {
      const projectName: string = response?.body[0]?.project;
      const server: string = response?.body[0]?.hosts[0];

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
    cy.wait('@fetchHostDetails').then((interception: Interception) => {
      if (interception.response) {
        const { statusCode, body }: { statusCode: number; body: Cypress.Response<any>['body'] } =
          interception.response;

        expect(statusCode).to.eq(200);
        expect(body).to.have.property('hostDetailsByInventoryType');
        expect(body).to.have.property('hostExists', true);
        expect(body).to.have.property('projectExists', true);
      } else {
        throw new Error('No response found');
      }
    });
  });

  it('Should display all buttons correctly', () => {
    cy.wait('@fetchHostDetails').then((interception: Interception) => {
      if (interception.response) {
        const body: Cypress.Response<any>['body'] = interception.response;
        const hostDetailsByInventoryType: HostDetails[] = body.hostDetailsByInventoryType;
        hostDetailsByInventoryType.forEach((hostDetails: HostDetails) => {
          const { inventoryType, variables }: { inventoryType: string; variables: HostVariable[] } =
            hostDetails;
          cy.get(`#inventory-button-${inventoryType}`).should('exist');
          variables.forEach((variable: HostVariable) => {
            const { type } = variable;
            cy.get(`#variables-button-${type}`).should('exist');
          });
        });
      }
    });
  });

  it('Should display all data correctly', () => {
    cy.wait('@fetchHostDetails').then((interception: Interception) => {
      if (interception.response) {
        const body: Cypress.Response<any>['body'] = interception.response;
        const hostDetailsByInventoryType: HostDetails[] = body.hostDetailsByInventoryType;
        hostDetailsByInventoryType.forEach(({ inventoryType, groupName }: HostDetails) => {
          cy.get(`#inventory-button-${inventoryType}`).then(($button: JQuery<HTMLElement>) => {
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
      }
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

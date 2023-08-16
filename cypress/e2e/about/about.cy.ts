/// <reference types="cypress" />
// Use local-cypress to avoid conflicts between jest and cypres.
import {cy, Cypress, expect, it} from 'local-cypress'
describe('about', () => {
  beforeEach(() => {
    cy.visit('/about')
  })
  it('list all components', () => {
    cy.get('*[class^="v-list-item v-list-item--link theme--light"]').should('have.length.gte', 4)
  })
  it('Check title', () => {
    cy.title().should('eq', "Delft-FEWS Web OC")
  })

})

/// <reference types="cypress" />
// Use local-cypress to avoid conflicts between jest and cypres.
import {cy, Cypress, expect, it} from 'local-cypress'
describe('map', () => {
  beforeEach(() => {
    cy.visit('/map')
  })

  it('Open map', () => {
    cy.title().should('eq', "Delft-FEWS WebOC")
  })

})

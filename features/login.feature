@regression
Feature: Login

  As a registered user
  I want to log in to the application
  So that I can access my account

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I enter username "testuser" and password "password123"
    And I click the login button
    Then I should be redirected to the dashboard

  Scenario: Failed login with invalid credentials
    When I enter username "invalid" and password "wrong"
    And I click the login button
    Then I should see an error message

  Scenario Outline: Login with multiple credentials
    When I enter username "<username>" and password "<password>"
    And I click the login button
    Then I should see the result "<result>"

    Examples:
      | username  | password    | result    |
      | admin     | admin123    | success   |
      | user1     | wrongpass   | error     |
      | guest     | nopassword  | error     |

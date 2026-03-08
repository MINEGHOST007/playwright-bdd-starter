@smoke
Feature: Home Page

  As a visitor
  I want to see the home page
  So that I can navigate to different sections

  Scenario: Visitor sees the home page heading
    Given I am on the home page
    Then I should see the page heading

  Scenario: Visitor clicks Get Started
    Given I am on the home page
    When I click the "Get started" link
    Then I should be navigated to the getting started page

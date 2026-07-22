# Testing Strategy

There are two types of unit tests being used for the frontend: component tests
for the Vue components, and standard unit tests for everything else.

## Component Testing

Documentation to be completed

## Non-Component Testing

For code that is not a Vue component, the unit under test is a function. Complex
dependencies like the ORM or network are mocked, and the units are tested as
black boxes. Subtleties are described in the sections below.

###

Factories in `__factories__` generate objects either in the shape of API
data or for the models themselves.

1. Factories should always be used when creating testing data
1. The default data from the factory should never be used for assertions. For
   example, if using `expect(tenant.name).toBe(...)` then the value must not be
   the factory default (as the factory might change). The value must be
   specified using the factory override (`makeTenant({ name: 'n'})`), and then
   asserted (`expect(tenant.name).toBe('n')`), which makes the test code more
   readable.

### Services

The `authenticated.axios` services is a special wrapper around Axios. The
`config` service deals with configuration. The `utils` file contains utilities
for the services. These all have file-specific tests.

The other services all make API calls and return results. They all use a similar
testing template, where for each service function that calls an API endpoint:

- API Call: mock an empty response and call with full data to ensure that the
  API call sends the correct data shape
- API Response: mock a full response and call with dummy data to ensure that
  the API response returns the correct data shape
- Network Error: fake a network error to check handling
- API Errors: fake all HTTP response codes to check handling
- Other Error: fake unexpected HTTP response to check handling

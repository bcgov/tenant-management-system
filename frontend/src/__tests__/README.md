# Testing Strategy

There are two types of unit tests being used for the frontend: component tests
for the Vue components, and standard unit tests for everything else.

## Component Testing

Vue components are tested using the framework that best matches the type of
component being tested.

### Presentational Components

Presentational components are tested using Vue Testing Library. These components
primarily render UI and emit events, with little or no business logic.

Tests should interact with the component in the same way a user would:

- Find elements by their accessible role or text
- Simulate user interactions such as clicking buttons or entering text
- Assert on visible behaviour rather than implementation details

Tests should not inspect component internals such as reactive state, computed
properties, or child component props.

### Container Components

Container components are tested using Vue Test Utils. These components
coordinate stores, routing, and communication between child components, and
typically contain little or no rendered UI of their own.

Tests focus on verifying that the container correctly coordinates its
dependencies, for example:

- Child component events are handled correctly
- The appropriate store or service methods are called
- Navigation occurs when expected
- Correct props are passed to child components

Inspecting child component props and emitting events directly from component
stubs is acceptable for container tests because these interactions are the
behaviour under test.

## Non-Component Testing

For code that is not a Vue component, the unit under test is a function. Complex
dependencies like the ORM or network are mocked, and the units are tested as
black boxes. Subtleties are described in the sections below.

### Factories

Factories in `__factories__` generate objects either in the shape of API
data or for the models themselves.

- Factories should always be used when creating testing data
- The default data from the factory should never be used for assertions. For
  example, if using `expect(tenant.name).toBe(...)` then the value must not be
  the factory default (as the factory might change). The value must be specified
  using the factory override (`makeTenant({ name: 'n'})`), and then asserted
  (`expect(tenant.name).toBe('n')`), which makes the test code more readable

### Services

The `authenticated.axios` service is a special wrapper around Axios. The
`config` service deals with configuration. The `utils` file contains utilities
for the services. These all have file-specific tests.

The other services all make API calls and return results. They all use a similar
testing template, where for each service function there is a test for:

- API Call: mock an empty response and call with full data to ensure that the
  API call sends the correct data shape
- API Response: mock a full response and call with dummy data to ensure that
  the API response returns the correct data shape
- Network Error: fake a network error to check handling
- API Errors: fake all HTTP response codes to check handling
- Other Error: fake unexpected HTTP response to check handling

### Stores

The `useAuthStore` service is the keycloak management store. This has
file-specific tests.

The other stores all call services and store results. They all use a similar
testing template, where for each store function there is a test for:

- Test that state is updated in the expected way(s)
- Test that state is not changed on service error

---
sidebar_position: 5
---

# Tenant association

A connected service can be set up in CSTAR without being available to every tenant.

Tenant association connects a specific tenant to a connected service.

## What association means

When a tenant is associated with a connected service, CSTAR treats that service as available for that tenant.

After that, connected-service roles can be assigned to groups in the tenant.

## Before association

Before a tenant is associated with a connected service, the service's roles cannot be assigned to groups in that tenant.

Connected-service access checks for that tenant will fail if the connected service is not associated with the tenant.

## After association

After association, tenant owners and user admins can manage access to the connected service through groups and connected-service role assignments.

The connected service can also call CSTAR APIs intended for connected-service access, as long as the request is for a tenant associated with that service. Authorization checks for the user ID provided in the token will apply (tenant membership etc.)

## Role assignment

Connected-service roles are assigned to tenant groups.

Users receive connected-service roles through their group membership.

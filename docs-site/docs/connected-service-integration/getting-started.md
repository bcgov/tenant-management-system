---
sidebar_position: 1
---

# Getting started

This page is for teams that want to integrate a connected service with CSTAR.

## Before integrating

A connected service should know:

- how it works with multiple tenants
- what roles it needs CSTAR to manage
- which identity providers it supports
- which lower environment it will test in

## Service roles

The connected service defines its own roles.

CSTAR stores those roles and lets tenant administrators assign them to groups.

CSTAR prescribes the effective set of roles for a given user; it is up to the connected service to incorporate / implement RBAC

## Tenant setup

A tenant must be associated with the connected service before the service's roles can be assigned to tenant groups.

## API docs

Use the CSTAR API reference for endpoint details.

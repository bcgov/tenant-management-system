import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { makeTenantRequest } from '@/__tests__/__factories__'

import TenantRequestDisplay from '@/components/tenantrequest/TenantRequestDisplay.vue'
import { TENANT_REQUEST_STATUS } from '@/utils/constants'

const vuetify = createVuetify({ components, directives })

const renderComponent = (
  props = {
    isDuplicateName: false,
    tenantRequest: makeTenantRequest(),
  },
) => {
  return render(TenantRequestDisplay, {
    global: {
      plugins: [vuetify],
    },
    props,
  })
}

describe('TenantRequestDisplay', () => {
  describe('page title', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          name: 'tenantRequestName',
          status: status,
        }),
      })

      expect(
        screen.getByRole('heading', { name: /tenant request/i }),
      ).toHaveTextContent('Tenant Request: tenantRequestName')
    })
  })

  describe('requested by field', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          createdBy: 'tenantRequestCreatedBy',
          status: status,
        }),
      })

      expect(screen.getByLabelText('Requested By')).toHaveValue(
        'tenantRequestCreatedBy',
      )
    })
  })

  describe('ministry/organization field', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          ministryName: 'tenantRequestMinistryName',
          status: status,
        }),
      })

      expect(screen.getByLabelText('Ministry/Organization')).toHaveValue(
        'tenantRequestMinistryName',
      )
    })
  })

  describe('date of request field', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          createdDate: 'tenantRequestCreatedDate',
          status: status,
        }),
      })

      expect(screen.getByLabelText('Date of Request (YYYY-MM-DD)')).toHaveValue(
        'tenantRequestCreatedDate',
      )
    })
  })

  describe('name field', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          name: 'tenantRequestName',
          status: status,
        }),
      })

      expect(screen.getByLabelText('Name of Tenant')).toHaveValue(
        'tenantRequestName',
      )
    })

    it('allows editing the name when a duplicate name is detected', async () => {
      const user = userEvent.setup()
      const { rerender } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.APPROVED.title,
        }),
      )

      await rerender({
        isDuplicateName: true,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: /name of tenant/i }),
        ).not.toBeDisabled()
      })
    })

    it('allows 150 characters but rejects 151 characters', async () => {
      const user = userEvent.setup()
      const { rerender } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await rerender({
        isDuplicateName: true,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      const nameField = screen.getByRole('textbox', { name: /name of tenant/i })

      await waitFor(() => {
        expect(nameField).toBeEnabled()
      })

      await user.clear(nameField)
      await user.type(nameField, 'a'.repeat(150))
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(
        screen.queryByText('Must be 150 characters or less'),
      ).not.toBeInTheDocument()

      await user.type(nameField, 'a')
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(
        screen.getByText('Must be 150 characters or less'),
      ).toBeInTheDocument()
    })

    it.each([
      ['', 'Required'],
      [' ', 'Cannot be only spaces'],
    ])('rejects a name containing %j', async (name, error) => {
      const user = userEvent.setup()
      const { rerender } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.APPROVED.title,
        }),
      )

      await rerender({
        isDuplicateName: true,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      const nameField = screen.getByRole('textbox', { name: /name of tenant/i })

      await waitFor(() => {
        expect(nameField).toBeEnabled()
      })

      await user.clear(nameField)

      if (name) {
        await user.type(nameField, name)
      }

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(screen.getByText(error)).toBeInTheDocument()
    })

    it('rejects the original tenant name', async () => {
      const user = userEvent.setup()
      const tenantRequest = makeTenantRequest({
        name: 'Original Name',
        status: TENANT_REQUEST_STATUS.NEW.value,
      })
      const { rerender } = renderComponent({
        isDuplicateName: false,
        tenantRequest,
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.APPROVED.title,
        }),
      )

      await rerender({
        isDuplicateName: true,
        tenantRequest,
      })

      const nameField = screen.getByRole('textbox', { name: /name of tenant/i })

      await waitFor(() => {
        expect(nameField).toBeEnabled()
      })

      await rerender({
        isDuplicateName: false,
        tenantRequest,
      })

      await user.clear(nameField)
      await user.type(nameField, '  Original Name  ')
      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    it('emits the edited name when approved', async () => {
      const user = userEvent.setup()
      const tenantRequest = makeTenantRequest({
        name: 'Original Name',
        status: TENANT_REQUEST_STATUS.NEW.value,
      })
      const { emitted, rerender } = renderComponent({
        isDuplicateName: false,
        tenantRequest,
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.APPROVED.title,
        }),
      )

      await rerender({
        isDuplicateName: true,
        tenantRequest,
      })

      const nameField = screen.getByRole('textbox', { name: /name of tenant/i })

      await user.clear(nameField)
      await user.type(nameField, 'New Tenant Name')

      await rerender({
        isDuplicateName: false,
        tenantRequest,
      })

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(emitted('approved')).toEqual([['New Tenant Name']])
    })
  })

  describe('description field', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('displays for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          description: 'tenantRequestDescription',
          status: status,
        }),
      })

      expect(screen.getByLabelText('Description of Tenant')).toHaveValue(
        'tenantRequestDescription',
      )
    })
  })

  describe('cancel button', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.NEW.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('exists and is enabled for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status,
        }),
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })

      expect(cancelButton).toBeEnabled()
    })

    it('emits cancel when clicked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted('cancel')).toHaveLength(1)
    })
  })

  describe('submit button', () => {
    it.each([
      TENANT_REQUEST_STATUS.APPROVED.value,
      TENANT_REQUEST_STATUS.REJECTED.value,
    ])('does not exist for %s tenant request', (status) => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status,
        }),
      })

      const submitButton = screen.queryByRole('button', { name: 'Submit' })

      expect(submitButton).not.toBeInTheDocument()
    })

    it('exists and is enabled for NEW tenant request', () => {
      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      const submitButton = screen.queryByRole('button', { name: 'Submit' })

      expect(submitButton).toBeEnabled()
    })

    it('emits approved with the tenant name when approved', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          name: 'tenantRequestName',
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.APPROVED.title,
        }),
      )

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(emitted('approved')).toEqual([['tenantRequestName']])
      })
    })

    it('does not reject when rejection notes are missing', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.REJECTED.title,
        }),
      )

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      expect(screen.getByText('Required')).toBeInTheDocument()
      expect(emitted('rejected')).toBeUndefined()
    })

    it('emits rejected with the rejection notes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.REJECTED.title,
        }),
      )

      await user.type(
        screen.getByLabelText(/rejection notes/i),
        'Tenant does not meet requirements',
      )

      await user.click(screen.getByRole('button', { name: 'Submit' }))

      await waitFor(() => {
        expect(emitted('rejected')).toEqual([
          ['Tenant does not meet requirements'],
        ])
      })
    })
  })

  describe('rejection notes', () => {
    it('shows rejection notes when rejected', async () => {
      const user = userEvent.setup()

      renderComponent({
        isDuplicateName: false,
        tenantRequest: makeTenantRequest({
          status: TENANT_REQUEST_STATUS.NEW.value,
        }),
      })

      await user.click(screen.getByRole('combobox', { name: /status/i }))
      await user.click(
        screen.getByRole('option', {
          name: TENANT_REQUEST_STATUS.REJECTED.title,
        }),
      )

      expect(screen.getByLabelText(/rejection notes/i)).toBeInTheDocument()
    })
  })
})

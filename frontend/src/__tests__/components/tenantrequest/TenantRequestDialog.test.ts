import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import TenantRequestDialog from '@/components/tenantrequest/TenantRequestDialog.vue'
import { MINISTRIES } from '@/utils/constants'

const vuetify = createVuetify({ components, directives })

const defaultProps = {
  isDuplicateName: false,
  modelValue: true,
}

const renderComponent = (props = defaultProps) => {
  return render(TenantRequestDialog, {
    global: {
      plugins: [vuetify],
    },
    props,
  })
}

describe('dialog visibility', () => {
  it('renders card content when modelValue is true', () => {
    renderComponent()

    expect(screen.getByText('Request New Tenant')).toBeInTheDocument()
  })

  it('does not render card content when modelValue is false', () => {
    renderComponent({ ...defaultProps, modelValue: false })

    expect(screen.queryByText('Request New Tenant')).not.toBeInTheDocument()
  })
})

describe('form validation', () => {
  it('requires a tenant name', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.click(screen.getByLabelText(/ministry\/organization/i))
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))

    await user.type(
      screen.getByLabelText(/description of tenant/i),
      'A description',
    )

    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })

  it('requires a ministry/organization', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(screen.getAllByText('Required')).toHaveLength(3)
    expect(emitted('submit')).toBeUndefined()
  })

  it('requires a description', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.type(screen.getByLabelText(/name of tenant/i), 'A name')

    await user.click(screen.getByLabelText(/ministry\/organization/i))
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))

    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a name containing only spaces', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.type(screen.getByLabelText(/name of tenant/i), '   ')
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(screen.getByText('Cannot be only spaces')).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a description containing only spaces', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.type(screen.getByLabelText(/description of tenant/i), '   ')
    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(screen.getByText('Cannot be only spaces')).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a name longer than 150 characters', async () => {
    const { emitted } = renderComponent()

    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'a'.repeat(151),
    )

    await fireEvent.click(
      screen.getByRole('button', { name: /submit request/i }),
    )

    expect(
      screen.getByText('Must be 150 characters or less'),
    ).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a description longer than 500 characters', async () => {
    const { emitted } = renderComponent()

    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'a'.repeat(501),
    )

    await fireEvent.click(
      screen.getByRole('button', { name: /submit request/i }),
    )

    expect(
      screen.getByText('Must be 500 characters or less'),
    ).toBeInTheDocument()
    expect(emitted('submit')).toBeUndefined()
  })
})

describe('submitting', () => {
  it('submits the tenant request details', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.type(screen.getByLabelText(/name of tenant/i), '  My Tenant  ')

    await user.click(screen.getByLabelText(/ministry\/organization/i))
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))

    await user.type(
      screen.getByLabelText(/description of tenant/i),
      '  A description  ',
    )

    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(emitted('submit')).toEqual([
      [
        {
          name: 'My Tenant',
          ministryName: MINISTRIES[0],
          description: 'A description',
        },
      ],
    ])
  })

  it('does not submit when the name is duplicated', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent({
      ...defaultProps,
      isDuplicateName: true,
    })

    await user.type(screen.getByLabelText(/name of tenant/i), 'Existing Tenant')

    await user.click(screen.getByLabelText(/ministry\/organization/i))
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))

    await user.type(
      screen.getByLabelText(/description of tenant/i),
      'A description',
    )

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /submit request/i }))

    expect(emitted('submit')).toBeUndefined()
  })
})

describe('duplicate name handling', () => {
  it('clears the duplicate error when the name changes', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent({
      ...defaultProps,
      isDuplicateName: true,
    })

    await user.type(screen.getByLabelText(/name of tenant/i), 'Existing Tenant')

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/name of tenant/i), ' Changed')

    expect(emitted('clearDuplicateError')).toBeTruthy()
  })

  it('clears the duplicate error when the ministry changes', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.click(screen.getByLabelText(/ministry\/organization/i))
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))

    expect(emitted('clearDuplicateError')).toBeTruthy()
  })

  it('does not clear the duplicate error when unrelated fields change', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.type(
      screen.getByLabelText(/description of tenant/i),
      'A description',
    )

    expect(emitted('clearDuplicateError')).toBeUndefined()
  })

  it('validates the form when a duplicate name error is set', async () => {
    const { rerender } = renderComponent()

    await rerender({
      ...defaultProps,
      isDuplicateName: true,
    })

    await waitFor(() => {
      expect(screen.getByLabelText(/name of tenant/i)).toBeInTheDocument()
    })
  })

  it('does not validate when the duplicate name error is cleared', async () => {
    const { rerender } = renderComponent({
      ...defaultProps,
      isDuplicateName: true,
    })

    await rerender({
      ...defaultProps,
      isDuplicateName: false,
    })

    expect(screen.getByLabelText(/name of tenant/i)).toBeInTheDocument()
  })
})

describe('dialog closing', () => {
  it('emits update:modelValue(false) when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(emitted('update:modelValue')).toEqual([[false]])
  })

  it('emits update:modelValue when the dialog is closed with Escape', async () => {
    const { emitted } = renderComponent()

    await fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(emitted('update:modelValue')).toEqual([[false]])
    })
  })

  it('resets the form when the dialog is reopened', async () => {
    const { rerender } = renderComponent({
      ...defaultProps,
      modelValue: false,
    })

    await rerender({
      ...defaultProps,
      modelValue: true,
    })

    expect(screen.getByLabelText(/name of tenant/i)).toHaveValue('')
  })
})

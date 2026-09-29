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

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render card content when modelValue is false', () => {
    renderComponent({ ...defaultProps, modelValue: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('form validation', () => {
  it('requires a tenant name', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(
      screen.getByLabelText(/name of tenant/i),
    ).toHaveAccessibleDescription('Required')
    expect(emitted('submit')).toBeUndefined()
  })

  it('requires a ministry/organization', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(
      screen.getByRole('combobox', { name: /ministry\/organization/i }),
    ).toHaveAccessibleDescription('Required')
    expect(emitted('submit')).toBeUndefined()
  })

  it('requires a description', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(screen.getByLabelText(/description/i)).toHaveAccessibleDescription(
      'Required',
    )
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a name containing only spaces', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await fireEvent.update(screen.getByLabelText(/name of tenant/i), '   ')
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(
      screen.getByLabelText(/name of tenant/i),
    ).toHaveAccessibleDescription('Cannot be only spaces')
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a description containing only spaces', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      '   ',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(screen.getByLabelText(/description/i)).toHaveAccessibleDescription(
      'Cannot be only spaces',
    )
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a name longer than 150 characters', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'a'.repeat(151),
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(
      screen.getByLabelText(/name of tenant/i),
    ).toHaveAccessibleDescription('Must be 150 characters or less')
    expect(emitted('submit')).toBeUndefined()
  })

  it('rejects a description longer than 500 characters', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'a'.repeat(501),
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(
      screen.getByLabelText(/description of tenant/i),
    ).toHaveAccessibleDescription('Must be 500 characters or less')
    expect(emitted('submit')).toBeUndefined()
  })
})

describe('submitting', () => {
  it('submits the tenant request details', async () => {
    const user = userEvent.setup()

    const { emitted } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      '  tenantName  ',
    )
    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      '  tenantDescription  ',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toEqual([
      [
        {
          description: 'tenantDescription',
          ministryName: MINISTRIES[0],
          name: 'tenantName',
        },
      ],
    ])
  })

  it('does not submit when the name is duplicated', async () => {
    const user = userEvent.setup()

    const { emitted, rerender } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'tenantName',
    )
    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'tenantDescription',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toHaveLength(1)

    await rerender({
      ...defaultProps,
      isDuplicateName: true,
    })

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toHaveLength(1)
  })
})

describe('duplicate name handling', () => {
  it('clears the duplicate error when the name changes', async () => {
    const user = userEvent.setup()

    const { emitted, rerender } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'tenantName',
    )
    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'tenantDescription',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toHaveLength(1)

    await rerender({
      ...defaultProps,
      isDuplicateName: true,
    })

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'newTenantName',
    )

    expect(emitted('clearDuplicateError')).toHaveLength(1)
  })

  it('clears the duplicate error when the ministry changes', async () => {
    const user = userEvent.setup()

    const { emitted, rerender } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'tenantName',
    )
    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'tenantDescription',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toHaveLength(1)

    await rerender({
      ...defaultProps,
      isDuplicateName: true,
    })

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[1] }))

    expect(emitted('clearDuplicateError')).toHaveLength(1)
  })

  it('does not clear the duplicate error when unrelated fields change', async () => {
    const user = userEvent.setup()

    const { emitted, rerender } = renderComponent()
    await fireEvent.update(
      screen.getByLabelText(/name of tenant/i),
      'tenantName',
    )
    await user.click(
      screen.getByRole('combobox', {
        name: /ministry\/organization/i,
      }),
    )
    await user.click(screen.getByRole('option', { name: MINISTRIES[0] }))
    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'tenantDescription',
    )
    await user.click(
      screen.getByRole('button', { name: /create tenant request/i }),
    )

    expect(emitted('submit')).toHaveLength(1)

    await rerender({
      ...defaultProps,
      isDuplicateName: true,
    })

    await waitFor(() => {
      expect(
        screen.getByText('Name must be unique for this ministry/organization'),
      ).toBeInTheDocument()
    })

    await fireEvent.update(
      screen.getByLabelText(/description of tenant/i),
      'newTenantDescription',
    )

    expect(emitted('clearDuplicateError')).toBeUndefined()
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

    expect(emitted('update:modelValue')).toEqual([[false]])
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
    expect(
      screen.getByRole('combobox', { name: /ministry\/organization/i }),
    ).toHaveValue('')
    expect(screen.getByLabelText(/description of tenant/i)).toHaveValue('')
  })
})

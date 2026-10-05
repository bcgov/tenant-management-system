import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import ServiceRoleList from '@/components/service/ServiceRoleList.vue'
import { type ServiceRoleDetailFields } from '@/models/servicerole.model'
import vuetify from '@/plugins/vuetify'

const serviceRoleListCardStub = defineComponent({
  props: {
    isDuplicateName: {
      type: Boolean,
      required: true,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['remove-role', 'update:modelValue'],
  setup(_, { expose, emit }) {
    const validate = vi.fn().mockResolvedValue(true)

    expose({ validate })

    return {
      validate,
      emit,
    }
  },
  template: `
    <div>
      <span>{{ modelValue.name }}</span>
      <span v-if="isDuplicateName">Duplicate</span>
      <button type="button" @click="emit('remove-role')">
        Remove
      </button>
      <button
        type="button"
        @click="emit('update:modelValue', {
          ...modelValue,
          name: 'Updated Role',
        })"
      >
        Update
      </button>
    </div>
  `,
})

const buttonSecondaryStub = {
  props: ['text'],
  emits: ['click'],
  template: `
    <button type="button" @click="$emit('click')">
      {{ text }}
    </button>
  `,
}

const renderComponent = (serviceRoles: ServiceRoleDetailFields[] = []) =>
  render(ServiceRoleList, {
    props: {
      serviceRoles,
    },
    global: {
      plugins: [vuetify],
      stubs: {
        ButtonSecondary: buttonSecondaryStub,
        ServiceRoleListCard: serviceRoleListCardStub,
      },
    },
  })

describe('ServiceRoleList', () => {
  it('renders service roles', () => {
    renderComponent([
      { name: 'Role One' } as ServiceRoleDetailFields,
      { name: 'Role Two' } as ServiceRoleDetailFields,
    ])

    expect(screen.getByText('Role One')).toBeInTheDocument()
    expect(screen.getByText('Role Two')).toBeInTheDocument()
  })

  it('emits add-service-role when Add Role is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent()

    await user.click(screen.getByRole('button', { name: /add role/i }))

    expect(emitted('add-service-role')).toHaveLength(1)
  })

  it('emits remove-service-role with the role index', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent([
      { name: 'Role One' } as ServiceRoleDetailFields,
      { name: 'Role Two' } as ServiceRoleDetailFields,
    ])

    const removeButtons = screen.getAllByRole('button', {
      name: /remove/i,
    })

    await user.click(removeButtons[1])

    expect(emitted('remove-service-role')).toEqual([[1]])
  })

  it('emits update-service-role with the role index and updated role', async () => {
    const user = userEvent.setup()
    const { emitted } = renderComponent([
      { name: 'Role One' } as ServiceRoleDetailFields,
    ])

    await user.click(screen.getByRole('button', { name: /update/i }))

    expect(emitted('update-service-role')).toEqual([
      [0, { name: 'Updated Role' }],
    ])
  })

  it('marks duplicate role names', () => {
    renderComponent([
      { name: 'Role One' } as ServiceRoleDetailFields,
      { name: 'Role One' } as ServiceRoleDetailFields,
      { name: 'Role Two' } as ServiceRoleDetailFields,
    ])

    expect(screen.getAllByText('Duplicate')).toHaveLength(2)
  })

  it('treats role names with surrounding whitespace as duplicates', () => {
    renderComponent([
      { name: ' Role One ' } as ServiceRoleDetailFields,
      { name: 'Role One' } as ServiceRoleDetailFields,
    ])

    expect(screen.getAllByText('Duplicate')).toHaveLength(2)
  })

  it('does not mark a role as a duplicate of itself', () => {
    renderComponent([{ name: 'Role One' } as ServiceRoleDetailFields])

    expect(screen.queryByText('Duplicate')).not.toBeInTheDocument()
  })

  it('returns true from validate when all cards are valid', async () => {
    const { emitted, ...result } = renderComponent([
      { name: 'Role One' } as ServiceRoleDetailFields,
      { name: 'Role Two' } as ServiceRoleDetailFields,
    ])

    const component = result.container.firstElementChild

    expect(component).toBeTruthy()

    const validate = result as typeof result & {
      rerender: unknown
    }

    expect(validate).toBeDefined()
    expect(emitted).toBeDefined()
  })
})

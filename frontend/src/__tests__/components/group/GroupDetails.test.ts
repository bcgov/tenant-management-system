import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { nextTick } from 'vue'

import GroupDetails from '@/components/group/GroupDetails.vue'
import { currentUserHasRole } from '@/utils/permissions'
import { type Group } from '@/models/group.model'
import { type Tenant } from '@/models/tenant.model'

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

const mockedHasRole = vi.mocked(currentUserHasRole)

interface GroupDetailsInstance {
  formData: { name: string; description: string }
  rules: {
    required: (v: string) => string | boolean
    maxLength: (max: number) => (v: string) => string | boolean
    notDuplicated: () => string | boolean
  }
  handleSubmit: () => Promise<void>
  handleCancel: () => void
  toggleEdit: () => void
  form: { validate: () => Promise<{ valid: boolean }> } | null
}

describe('GroupDetails.vue', () => {
  const vuetify = createVuetify({ components, directives })
  const mockGroup: Group = {
    name: 'Test Group',
    description: 'Test Desc',
  } as Group
  const mockTenant: Tenant = { id: 'tenant-1' } as unknown as Tenant

  const mountComponent = (props = {}) => {
    return mount(GroupDetails, {
      props: {
        group: mockGroup,
        tenant: mockTenant,
        isEditing: false,
        isDuplicateName: false,
        ...props,
      },
      global: { plugins: [vuetify] },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedHasRole.mockReturnValue(true)
  })

  describe('Display Mode', () => {
    it('renders disabled fields when not editing', () => {
      const wrapper = mountComponent({ isEditing: false })
      const nameField = wrapper.findComponent({ name: 'v-text-field' })
      expect(nameField.props('modelValue')).toBe(mockGroup.name)
      expect(nameField.props('disabled')).toBe(true)
    })
  })

  describe('Edit Mode & Actions', () => {
    it('resets data and stops editing on cancel', async () => {
      const wrapper = mountComponent({ isEditing: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance
      vm.formData.name = 'Changed'
      vm.handleCancel()
      await nextTick()
      expect(vm.formData.name).toBe(mockGroup.name)
      expect(wrapper.emitted('update:isEditing')?.[0]).toEqual([false])
    })

    it('emits update on valid handleSubmit', async () => {
      const wrapper = mountComponent({ isEditing: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance

      const form = vm.form
      if (!form) {
        throw new Error('form ref is not defined')
      }
      vi.spyOn(form, 'validate').mockResolvedValue({ valid: true })

      vm.formData.name = '  New Name  '
      vm.formData.description = 'Test Desc'

      await vm.handleSubmit()

      expect(wrapper.emitted('update')?.[0]).toEqual([
        {
          name: 'New Name',
          description: 'Test Desc',
        },
      ])
    })

    it('does not emit update when form is invalid', async () => {
      const wrapper = mountComponent({ isEditing: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance

      const form = vm.form
      if (!form) {
        throw new Error('form ref is not defined')
      }
      vi.spyOn(form, 'validate').mockResolvedValue({ valid: false })

      await vm.handleSubmit()

      expect(wrapper.emitted('update')).toBeUndefined()
    })
  })

  describe('Watchers & Logic', () => {
    it('re-validates form when isDuplicateName becomes true', async () => {
      const wrapper = mountComponent({ isEditing: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance

      // vm.form points to the real VForm instance mounted by Vuetify.
      // We must spy on that object directly — replacing vm.form would not
      // affect the internal ref the watcher closes over.
      const form = vm.form
      if (!form) {
        throw new Error('form ref is not defined')
      }
      const validateSpy = vi
        .spyOn(form, 'validate')
        .mockResolvedValue({ valid: false })

      await wrapper.setProps({ isDuplicateName: true })

      // The watcher awaits nextTick before calling validate, so we need to
      // flush two ticks: one for the watcher body, one for the validate call.
      await nextTick()
      await nextTick()

      expect(validateSpy).toHaveBeenCalled()
    })

    it('clears duplicate error when name changes', async () => {
      const wrapper = mountComponent({ isEditing: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance
      vm.formData.name = 'New Name'
      await nextTick()
      expect(wrapper.emitted('clear-duplicate-error')).toBeTruthy()
    })
  })

  describe('Validation Rules', () => {
    it('covers all rule branches', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as unknown as GroupDetailsInstance

      // required
      expect(vm.rules.required('')).toBe('Required')
      expect(vm.rules.required('  ')).toBe('Cannot be only spaces')
      expect(vm.rules.required('ok')).toBe(true)

      // maxLength
      const maxRule = vm.rules.maxLength(2)
      expect(maxRule('abc')).toBe('Must be 2 characters or less')
      expect(maxRule('ab')).toBe(true)
      expect(maxRule('')).toBe(true)

      // notDuplicated — both branches
      expect(vm.rules.notDuplicated()).toBe(true) // isDuplicateName is false by default
    })

    it('notDuplicated returns error message when isDuplicateName is true', async () => {
      const wrapper = mountComponent({ isDuplicateName: true })
      const vm = wrapper.vm as unknown as GroupDetailsInstance
      expect(vm.rules.notDuplicated()).toBe('Name must be unique')
    })
  })
})

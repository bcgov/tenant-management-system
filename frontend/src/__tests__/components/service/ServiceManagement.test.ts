import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeService, makeTenant } from '@/__tests__/__factories__'

import ServiceManagement from '@/components/service/ServiceManagement.vue'
import { type Service, toServiceId } from '@/models/service.model'
import type { Tenant } from '@/models/tenant.model'
import vuetify from '@/plugins/vuetify'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

const service1 = makeService({
  id: toServiceId('serviceId1'),
  name: 'serviceName1',
})

const service2 = makeService({
  id: toServiceId('serviceId2'),
  name: 'serviceName2',
})

const tenant = makeTenant()

const defaultProps: {
  services: Service[]
  tenant: Tenant
  tenantServices: Service[]
} = {
  services: [service1, service2],
  tenant: tenant,
  tenantServices: [],
}

const renderComponent = (props = defaultProps) => {
  return render(ServiceManagement, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        ServiceList: {
          props: ['isTenantOwner', 'services'],
          template: `
            <div>
              <button
                v-for="service in services"
                :key="service.id"
                @click="$emit('add-service', service.id)"
              >
                Add {{ service.name }}
              </button>
            </div>
          `,
        },
        TenantServiceList: {
          props: ['tenantServices'],
          template: `
            <div>
              <div v-for="service in tenantServices" :key="service.id">
                {{ service.name }}
              </div>
            </div>
          `,
        },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ServiceManagement', () => {
  describe('empty state', () => {
    it('shows the empty environment message when there are no services', () => {
      renderComponent({
        ...defaultProps,
        services: [],
      })

      expect(
        screen.getByRole('heading', { name: 'Connected Services' }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'There are no Connected Services set up in this CSTAR environment.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('tenant services', () => {
    it('shows the tenant services', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      renderComponent({
        ...defaultProps,
        tenantServices: [service1],
      })

      expect(
        screen.getByRole('heading', { name: 'Connected Services' }),
      ).toBeInTheDocument()
      expect(screen.getByText(service1.name)).toBeInTheDocument()
    })

    it('does not show a tenant service as an available service', () => {
      renderComponent({
        ...defaultProps,
        tenantServices: [service1],
      })

      expect(
        screen.queryByRole('button', { name: `Add ${service1.name}` }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: `Add ${service2.name}` }),
      ).toBeInTheDocument()
    })

    it('shows the available services heading when tenant services exist', () => {
      renderComponent({
        ...defaultProps,
        tenantServices: [service1],
      })

      expect(
        screen.getByRole('heading', { name: 'Available Services' }),
      ).toBeInTheDocument()
    })

    it('shows the all-services-added message when no services are available', () => {
      renderComponent({
        ...defaultProps,
        tenantServices: [service1, service2],
      })

      expect(
        screen.getByText(
          'All available services have already been added to this tenant. Additional connected services will appear here when they become available.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('tenant owner', () => {
    it('shows the add-first-service message for a tenant owner', () => {
      renderComponent()

      expect(
        screen.getByRole('heading', {
          name: 'Add your first Connected Service',
        }),
      ).toBeInTheDocument()
    })

    it('shows the add-service instructions for a tenant owner', () => {
      renderComponent()

      expect(
        screen.getByText(
          'Add a Connected Service, then go to Service Roles to assign roles to groups.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('non-tenant owner', () => {
    it('shows the managed-by-owner message when no services have been added', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)
      renderComponent()

      expect(
        screen.getByRole('heading', {
          name: 'No Connected Services have been added',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Connected Services are managed by Tenant Owners.'),
      ).toBeInTheDocument()
    })

    it('shows the contact-owner message when additional services are available', () => {
      renderComponent({
        ...defaultProps,
        tenantServices: [service1],
      })

      expect(
        screen.getByText(
          'Contact a Tenant Owner to request additional services.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('add service', () => {
    it('emits add-service with the selected service id', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(
        screen.getByRole('button', { name: `Add ${service1.name}` }),
      )

      expect(emitted()['add-service']).toEqual([[service1.id]])
    })
  })
})

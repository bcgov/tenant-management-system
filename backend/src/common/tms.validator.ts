import { Joi } from 'express-validation'

export default {

    createTenant: {
        body: Joi.object({
            name: Joi.string().min(1).max(30).pattern(/^\S.*\S$/).required(),
            ministryName: Joi.string().min(1).max(100).required(),
            description: Joi.string().min(1).max(500).optional(),
            user: Joi.object().keys({
                firstName: Joi.string().min(1).max(50).required(),
                lastName: Joi.string().min(1).max(50).required(),
                displayName: Joi.string().min(1).max(50).required(),
                userName: Joi.string().min(1).max(15).optional(),
                ssoUserId: Joi.string().required(), // will need to be updated to the right regex and length
                email:Joi.string().email().max(100).required(),                
            }).required()
        }).options({abortEarly:false,convert:false})
    },

    addTenantUser: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }),
        body: Joi.object({
            user: Joi.object().keys({
                firstName: Joi.string().min(1).max(50).required(),
                lastName: Joi.string().min(1).max(50).required(),
                displayName: Joi.string().min(1).max(50).required(),
                userName: Joi.string().min(1).max(15).optional(),
                ssoUserId: Joi.string().required(), // will need to be updated to the right regex and length
                email:Joi.string().email().max(100).required(),                
            }).required(),
            roles: Joi.array().items(
                Joi.string().guid()
            ).min(1).max(3).required()
        }).options({abortEarly:false,convert:false})
    },

    getUserTenants: {
        params: Joi.object({
            ssoUserId: Joi.string().min(2).required()
        }),
        query: Joi.object({
            expand: Joi.string().optional()
                .pattern(/^(tenantUserRoles)?$/)
        }).optional()
    },

    getTenantUsers: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }).options({abortEarly:false,convert:false})
    },

    createTenantRoles: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }),
        body: Joi.object({
            role: Joi.object().keys({
                name: Joi.string().min(1).max(100).required(),
                description: Joi.string().min(1).max(255).required()
            }).min(1)
        }).options({abortEarly:false,convert:false})
    },

    assignUserRoles: {
        params: Joi.object({
            tenantId: Joi.string().guid().required(),
            tenantUserId: Joi.string().guid().required()
        }),
        body: Joi.object({
            roles: Joi.array().items(Joi.string().guid()).min(1).required()
        }).options({abortEarly:false,convert:false})
    },

    getTenantRoles: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }).options({abortEarly:false,convert:false})
    },

    getUserRoles: {
        params: Joi.object({
            tenantId: Joi.string().guid().required(),
            tenantUserId: Joi.string().guid().required()
        }).options({abortEarly:false,convert:false})
    },

    unassignUserRoles: {
        params: Joi.object({
            tenantId: Joi.string().guid().required(),
            tenantUserId: Joi.string().guid().required(),
            roleId: Joi.string().guid().required()
        }).options({abortEarly:false,convert:false})
    },

    searchBCGOVSSOUsers: {
        query: Joi.object({
            firstName: Joi.string(),
            lastName: Joi.string(),
            email: Joi.string(),
            guid: Joi.string()
        }).or('firstName', 'lastName', 'email', 'guid')
    },
    
    getTenant: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }),
        query: Joi.object({
            expand: Joi.string().optional()
                .pattern(/^(tenantUserRoles)?$/)
        }).optional()
    },

    getRolesForSSOUser: {
        params: Joi.object({
            tenantId: Joi.string().guid().required(),
            ssoUserId: Joi.string().required()
        }).options({abortEarly:false,convert:false})
    },

    updateTenant: {
        params: Joi.object({
            tenantId: Joi.string().guid().required()
        }),
        body: Joi.object({
            name: Joi.string().min(1).max(30).pattern(/^\S.*\S$/).optional(),
            ministryName: Joi.string().min(1).max(100).optional(),
            description: Joi.string().min(1).max(500).optional()
        }).options({abortEarly:false,convert:false})
    },

    createTenantRequest: {
        body: Joi.object({
            name: Joi.string().min(1).max(30).pattern(/^\S.*\S$/).required(),
            ministryName: Joi.string().min(1).max(100).required(),
            description: Joi.string().min(1).max(500).optional(),
            user: Joi.object().keys({
                firstName: Joi.string().min(1).max(50).required(),
                lastName: Joi.string().min(1).max(50).required(),
                displayName: Joi.string().min(1).max(50).required(),
                userName: Joi.string().min(1).max(15).optional(),
                ssoUserId: Joi.string().required(),
                email: Joi.string().email().max(100).required(),                
            }).required()
        }).options({abortEarly:false,convert:false})
    },

    updateTenantRequestStatus: {
        params: Joi.object({
            requestId: Joi.string().guid().required()
        }),
        body: Joi.object({
            status: Joi.string().valid('APPROVED', 'REJECTED').required(),
            rejectionReason: Joi.string().when('status', {
                is: 'REJECTED',
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            })
        })
    },

    getTenantRequests: {
        query: Joi.object({
            status: Joi.string().valid('NEW', 'APPROVED', 'REJECTED').optional()
        }).optional()
    }

}
import { Joi } from 'express-validation'

export default {

    createTenant: {
        body: Joi.object({
            name: Joi.string().min(1).max(30).required(),
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
        }).options({abortEarly:false,convert:false})
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
    }

}
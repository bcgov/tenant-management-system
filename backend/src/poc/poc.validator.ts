import { Joi } from 'express-validation'

const userId = Joi.string().min(2).max(64).required()
const serviceId = Joi.string().min(2).max(55)

export default {
  getTenants: {
    query: Joi.object({
      userId,
      serviceId: serviceId.optional(),
    }).options({ abortEarly: false, convert: false }),
  },

  getRoles: {
    query: Joi.object({
      tenantId: Joi.string().guid().required(),
      userId,
      serviceId: serviceId.required(),
    }).options({ abortEarly: false, convert: false }),
  },

  getGroups: {
    query: Joi.object({
      tenantId: Joi.string().guid().required(),
      userId,
      serviceId: serviceId.required(),
    }).options({ abortEarly: false, convert: false }),
  },
}

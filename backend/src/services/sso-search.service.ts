import { Request } from 'express'
import { URLSearchParams } from 'url'
import axios from 'axios'
import logger from '../common/logger'
import { BadRequestError } from '../errors/BadRequestError'
import { getErrorMessage } from '../common/error.handler'
import { config } from './config.service'

export class SSOSearchService {
  private getIdirGuid(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') {
      return undefined
    }

    const attributes = (user as { attributes?: unknown }).attributes
    if (!attributes || typeof attributes !== 'object') {
      return undefined
    }

    const idirUserGuid = (attributes as { idir_user_guid?: unknown })
      .idir_user_guid
    if (!Array.isArray(idirUserGuid) || typeof idirUserGuid[0] !== 'string') {
      return undefined
    }

    return idirUserGuid[0]
  }

  private getIdirUserCompletenessScore(user: unknown): number {
    if (!user || typeof user !== 'object') {
      return 0
    }

    const typedUser = user as {
      firstName?: unknown
      lastName?: unknown
      email?: unknown
      username?: unknown
      attributes?: {
        display_name?: unknown
        idir_username?: unknown
      }
    }

    let score = 0

    if (typeof typedUser.firstName === 'string' && typedUser.firstName.trim()) {
      score += 1
    }
    if (typeof typedUser.lastName === 'string' && typedUser.lastName.trim()) {
      score += 1
    }
    if (typeof typedUser.email === 'string' && typedUser.email.trim()) {
      score += 1
    }
    if (typeof typedUser.username === 'string' && typedUser.username.trim()) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.display_name) &&
      typeof typedUser.attributes.display_name[0] === 'string' &&
      typedUser.attributes.display_name[0].trim()
    ) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.idir_username) &&
      typeof typedUser.attributes.idir_username[0] === 'string' &&
      typedUser.attributes.idir_username[0].trim()
    ) {
      score += 1
    }
    if (this.getIdirGuid(user)) {
      score += 1
    }

    return score
  }

  private dedupIdirSearchResults(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    const data = (payload as { data?: unknown }).data
    if (!Array.isArray(data)) {
      return payload
    }

    const dedupedUsers = new Map<
      string,
      { user: unknown; score: number; firstSeenIndex: number }
    >()
    const usersWithoutGuid: Array<{ user: unknown; index: number }> = []

    data.forEach((user, index) => {
      const guid = this.getIdirGuid(user)

      if (!guid) {
        usersWithoutGuid.push({ user, index })
        return
      }

      const score = this.getIdirUserCompletenessScore(user)
      const existing = dedupedUsers.get(guid)

      if (!existing || score > existing.score) {
        dedupedUsers.set(guid, {
          user,
          score,
          firstSeenIndex: existing?.firstSeenIndex ?? index,
        })
      }
    })

    const dedupedData = [
      ...Array.from(dedupedUsers.values()).map((entry) => ({
        user: entry.user,
        index: entry.firstSeenIndex,
      })),
      ...usersWithoutGuid,
    ]
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.user)

    return {
      ...(payload as Record<string, unknown>),
      data: dedupedData,
    }
  }

  private getBceidGuid(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') {
      return undefined
    }

    const attributes = (user as { attributes?: unknown }).attributes
    if (!attributes || typeof attributes !== 'object') {
      return undefined
    }

    const bceidUserGuid = (attributes as { bceid_user_guid?: unknown })
      .bceid_user_guid
    if (!Array.isArray(bceidUserGuid) || typeof bceidUserGuid[0] !== 'string') {
      return undefined
    }

    return bceidUserGuid[0]
  }

  private hasBceidBusinessGuid(user: unknown): boolean {
    if (!user || typeof user !== 'object') {
      return false
    }

    const attributes = (user as { attributes?: unknown }).attributes
    if (!attributes || typeof attributes !== 'object') {
      return false
    }

    const businessGuid = (attributes as { bceid_business_guid?: unknown })
      .bceid_business_guid
    return Array.isArray(businessGuid) && typeof businessGuid[0] === 'string'
  }

  private filterBceidBusinessSearchResults(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    const data = (payload as { data?: unknown }).data
    if (!Array.isArray(data)) {
      return payload
    }

    return {
      ...(payload as Record<string, unknown>),
      data: data.filter((user) => this.hasBceidBusinessGuid(user)),
    }
  }

  private getBceidUserCompletenessScore(user: unknown): number {
    if (!user || typeof user !== 'object') {
      return 0
    }

    const typedUser = user as {
      firstName?: unknown
      lastName?: unknown
      email?: unknown
      username?: unknown
      attributes?: {
        display_name?: unknown
        bceid_username?: unknown
      }
    }

    let score = 0

    if (typeof typedUser.firstName === 'string' && typedUser.firstName.trim()) {
      score += 1
    }
    if (typeof typedUser.lastName === 'string' && typedUser.lastName.trim()) {
      score += 1
    }
    if (typeof typedUser.email === 'string' && typedUser.email.trim()) {
      score += 1
    }
    if (typeof typedUser.username === 'string' && typedUser.username.trim()) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.display_name) &&
      typeof typedUser.attributes.display_name[0] === 'string' &&
      typedUser.attributes.display_name[0].trim()
    ) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.bceid_username) &&
      typeof typedUser.attributes.bceid_username[0] === 'string' &&
      typedUser.attributes.bceid_username[0].trim()
    ) {
      score += 1
    }
    if (this.getBceidGuid(user)) {
      score += 1
    }

    return score
  }

  private dedupBceidSearchResults(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    const data = (payload as { data?: unknown }).data
    if (!Array.isArray(data)) {
      return payload
    }

    const dedupedUsers = new Map<
      string,
      { user: unknown; score: number; firstSeenIndex: number }
    >()
    const usersWithoutGuid: Array<{ user: unknown; index: number }> = []

    data.forEach((user, index) => {
      const guid = this.getBceidGuid(user)

      if (!guid) {
        usersWithoutGuid.push({ user, index })
        return
      }

      const score = this.getBceidUserCompletenessScore(user)
      const existing = dedupedUsers.get(guid)

      if (!existing || score > existing.score) {
        dedupedUsers.set(guid, {
          user,
          score,
          firstSeenIndex: existing?.firstSeenIndex ?? index,
        })
      }
    })

    const dedupedData = [
      ...Array.from(dedupedUsers.values()).map((entry) => ({
        user: entry.user,
        index: entry.firstSeenIndex,
      })),
      ...usersWithoutGuid,
    ]
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.user)

    return {
      ...(payload as Record<string, unknown>),
      data: dedupedData,
    }
  }

  private async getToken() {
    try {
      const response = await axios.post(
        config.bcgovSsoApi.tokenUrl,
        new URLSearchParams({
          client_id: config.bcgovSsoApi.clientId,
          client_secret: config.bcgovSsoApi.clientSecret,
          grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
      return response.data.access_token
    } catch (error: unknown) {
      throw new Error(
        'Failed to obtain access token: ' + getErrorMessage(error),
      )
    }
  }

  public async searchBCGOVSSOUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const response = await axios.get(config.bcgovSsoApi.url, {
        headers: { Authorization: `Bearer ${token}` },
        params: req.query,
      })

      return this.dedupIdirSearchResults(response.data)
    } catch (error: unknown) {
      logger.error('BC Gov SSO IDIR search failed', {
        error: getErrorMessage(error),
      })
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (
          error as {
            response?: { status?: number; data?: { message?: string } }
          }
        ).response?.status === 'number'
      ) {
        const axiosError = error as {
          response: { status: number; data?: { message?: string } }
        }
        if (axiosError.response.status === 400) {
          throw new BadRequestError(
            `BC GOV SSO API returned bad request: ${axiosError.response.data?.message || getErrorMessage(error)}`,
          )
        }
      }
      throw new Error(
        'Error invoking BC GOV SSO API. ' + getErrorMessage(error),
      )
    }
  }

  public async searchBCGOVSSOBceidUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const params = {
        ...req.query,
        bceidType: 'business',
      }
      const response = await axios.get(config.bcgovSsoApi.urlBceid, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })

      return this.dedupBceidSearchResults(
        this.filterBceidBusinessSearchResults(response.data),
      )
    } catch (error: unknown) {
      logger.error('BC Gov SSO BCeID search failed', {
        error: getErrorMessage(error),
      })
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (
          error as {
            response?: { status?: number; data?: { message?: string } }
          }
        ).response?.status === 'number'
      ) {
        const axiosError = error as {
          response: { status: number; data?: { message?: string } }
        }
        if (axiosError.response.status === 400) {
          throw new BadRequestError(
            `BC GOV SSO BCEID API returned bad request: ${axiosError.response.data?.message || getErrorMessage(error)}`,
          )
        }
      }
      throw new Error(
        'Error invoking BC GOV SSO BCEID API. ' + getErrorMessage(error),
      )
    }
  }
}

export const ssoSearchService = new SSOSearchService()

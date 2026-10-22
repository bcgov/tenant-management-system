import { Request } from 'express'
import { URLSearchParams } from 'url'
import logger from '../common/logger'
import { BadRequestError } from '../errors/BadRequestError'
import { getErrorMessage } from '../common/error.handler'
import { HttpError, requestJson } from '../common/http'
import { config } from './config.service'

const IDIR_USERS_PATH = /\/idir\/users\/?$/
const AZURE_IDIR_USERS_PATH = '/azure-idir/users'
const IDIR_API_NAME = 'BC GOV SSO API'
const BCEID_API_NAME = 'BC GOV SSO BCEID API'

const isQueryValue = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

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

  private dedupSearchResultsByGuid(
    payload: unknown,
    getGuid: (user: unknown) => string | undefined,
    getCompletenessScore: (user: unknown) => number,
  ) {
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
      const guid = getGuid(user)

      if (!guid) {
        usersWithoutGuid.push({ user, index })
        return
      }

      const score = getCompletenessScore(user)
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

  private dedupIdirSearchResults(payload: unknown) {
    return this.dedupSearchResultsByGuid(
      payload,
      (user) => this.getIdirGuid(user),
      (user) => this.getIdirUserCompletenessScore(user),
    )
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
    return this.dedupSearchResultsByGuid(
      payload,
      (user) => this.getBceidGuid(user),
      (user) => this.getBceidUserCompletenessScore(user),
    )
  }

  private withQuery(url: string, query: Record<string, unknown>) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (isQueryValue(item)) {
          params.append(key, `${item}`)
        }
      }
    }
    const search = params.toString()
    return search ? `${url}?${search}` : url
  }

  private getUsers(url: string, token: string, query: Record<string, unknown>) {
    return requestJson(this.withQuery(url, query), {
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  private toSearchError(error: unknown, apiName: string) {
    if (error instanceof HttpError && error.status === 400) {
      return new BadRequestError(
        `${apiName} returned bad request: ${error.apiMessage ?? error.message}`,
      )
    }
    return new Error(`Error invoking ${apiName}. ${getErrorMessage(error)}`)
  }

  private async getToken() {
    try {
      const body = await requestJson(config.bcgovSsoApi.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.bcgovSsoApi.clientId,
          client_secret: config.bcgovSsoApi.clientSecret,
          grant_type: 'client_credentials',
        }),
      })
      return (body as { access_token: string }).access_token
    } catch (error: unknown) {
      throw new Error(
        `Failed to obtain access token: ${getErrorMessage(error)}`,
      )
    }
  }

  private getAzureIdirUrl(): string | undefined {
    const idirUrl = config.bcgovSsoApi.url
    if (!IDIR_USERS_PATH.test(idirUrl)) {
      return undefined
    }
    return idirUrl.replace(IDIR_USERS_PATH, AZURE_IDIR_USERS_PATH)
  }

  private getSearchResultUsers(payload: unknown): unknown[] {
    if (!payload || typeof payload !== 'object') {
      return []
    }
    const data = (payload as { data?: unknown }).data
    return Array.isArray(data) ? data : []
  }

  private async searchDirectory(
    url: string,
    token: string,
    query: Request['query'],
  ) {
    try {
      const payload = await this.getUsers(url, token, query)
      return {
        failed: false,
        users: this.getSearchResultUsers(payload),
        error: undefined as unknown,
      }
    } catch (error: unknown) {
      return { failed: true, users: [] as unknown[], error }
    }
  }

  private async searchIdirDirectories(token: string, query: Request['query']) {
    const urls = [this.getAzureIdirUrl(), config.bcgovSsoApi.url].filter(
      (url): url is string => Boolean(url),
    )
    const searches = urls.map((url) => this.searchDirectory(url, token, query))

    const users: unknown[] = []
    const errors: unknown[] = []
    for (const search of searches) {
      const result = await search
      if (result.failed) {
        errors.push(result.error)
      } else {
        users.push(...result.users)
      }
    }

    if (errors.length === searches.length) {
      throw errors.at(-1)
    }
    for (const error of errors) {
      logger.warn('BC Gov SSO IDIR search failed for one directory', {
        error: getErrorMessage(error),
      })
    }

    return { data: users }
  }

  public async searchBCGOVSSOUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const payload = await this.searchIdirDirectories(token, req.query)

      return this.dedupIdirSearchResults(payload)
    } catch (error: unknown) {
      logger.error('BC Gov SSO IDIR search failed', {
        error: getErrorMessage(error),
      })
      throw this.toSearchError(error, IDIR_API_NAME)
    }
  }

  public async searchBCGOVSSOBceidUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const payload = await this.getUsers(config.bcgovSsoApi.urlBceid, token, {
        ...req.query,
        bceidType: 'business',
      })

      return this.dedupBceidSearchResults(
        this.filterBceidBusinessSearchResults(payload),
      )
    } catch (error: unknown) {
      logger.error('BC Gov SSO BCeID search failed', {
        error: getErrorMessage(error),
      })
      throw this.toSearchError(error, BCEID_API_NAME)
    }
  }
}

export const ssoSearchService = new SSOSearchService()

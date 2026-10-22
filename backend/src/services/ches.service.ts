import { URLSearchParams } from 'url'
import { getErrorMessage } from '../common/error.handler'
import { requestJson } from '../common/http'
import { config } from './config.service'

const REQUEST_TIMEOUT_MS = 5000
const TOKEN_EXPIRY_BUFFER_MS = 30000

export const NOTIFICATION_FROM_EMAIL = 'CSTAR@gov.bc.ca'

export interface ChesEmail {
  to: string[]
  subject: string
  body: string
}

export interface ChesSendResult {
  msgId?: string
  txId?: string
}

interface ChesTokenResponse {
  access_token: string
  expires_in?: number
}

interface ChesEmailResponse {
  messages?: { msgId?: string }[]
  txId?: string
}

export class ChesService {
  private cachedToken: string | null = null
  private cachedTokenExpiresAt = 0

  public isConfigured(): boolean {
    return Boolean(
      config.ches?.clientId &&
      config.ches?.clientSecret &&
      config.ches?.tokenUrl &&
      config.ches?.apiUrl,
    )
  }

  private async getToken() {
    if (this.cachedToken && Date.now() < this.cachedTokenExpiresAt) {
      return this.cachedToken
    }

    try {
      const response = (await requestJson(config.ches.tokenUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.ches.clientId as string,
          client_secret: config.ches.clientSecret as string,
          grant_type: 'client_credentials',
        }),
        timeoutMs: REQUEST_TIMEOUT_MS,
      })) as ChesTokenResponse

      const token: string = response.access_token
      const expiresInMs: number = (response.expires_in ?? 0) * 1000

      this.cachedToken = token
      this.cachedTokenExpiresAt =
        Date.now() + Math.max(expiresInMs - TOKEN_EXPIRY_BUFFER_MS, 0)

      return token
    } catch (error: unknown) {
      this.cachedToken = null
      this.cachedTokenExpiresAt = 0
      throw new Error(
        `Failed to obtain CHES access token: ${getErrorMessage(error)}`,
      )
    }
  }

  public async sendEmail(email: ChesEmail) {
    const token: string = await this.getToken()

    const response = (await requestJson(config.ches.apiUrl as string, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bodyType: 'text',
        body: email.body,
        from: NOTIFICATION_FROM_EMAIL,
        subject: email.subject,
        to: email.to,
        encoding: 'utf-8',
        priority: 'normal',
      }),
      timeoutMs: REQUEST_TIMEOUT_MS,
    })) as ChesEmailResponse | null

    const result: ChesSendResult = {
      msgId: response?.messages?.[0]?.msgId,
      txId: response?.txId,
    }

    return result
  }
}

export const chesService = new ChesService()

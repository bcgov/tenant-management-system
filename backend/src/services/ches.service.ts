import axios from 'axios'
import { URLSearchParams } from 'url'
import { getErrorMessage } from '../common/error.handler'
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
      const response = await axios.post(
        config.ches.tokenUrl as string,
        new URLSearchParams({
          client_id: config.ches.clientId as string,
          client_secret: config.ches.clientSecret as string,
          grant_type: 'client_credentials',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: REQUEST_TIMEOUT_MS,
        },
      )

      const token: string = response.data.access_token
      const expiresInMs: number = (response.data.expires_in || 0) * 1000

      this.cachedToken = token
      this.cachedTokenExpiresAt =
        Date.now() + Math.max(expiresInMs - TOKEN_EXPIRY_BUFFER_MS, 0)

      return token
    } catch (error: unknown) {
      this.cachedToken = null
      this.cachedTokenExpiresAt = 0
      throw new Error(
        'Failed to obtain CHES access token: ' + getErrorMessage(error),
      )
    }
  }

  public async sendEmail(email: ChesEmail) {
    const token: string = await this.getToken()

    const response = await axios.post(
      config.ches.apiUrl as string,
      {
        bodyType: 'text',
        body: email.body,
        from: NOTIFICATION_FROM_EMAIL,
        subject: email.subject,
        to: email.to,
        encoding: 'utf-8',
        priority: 'normal',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: REQUEST_TIMEOUT_MS,
      },
    )

    const result: ChesSendResult = {
      msgId: response.data?.messages?.[0]?.msgId,
      txId: response.data?.txId,
    }

    return result
  }
}

export const chesService = new ChesService()

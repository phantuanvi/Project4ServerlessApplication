import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { Jwk } from '../../auth/Jwk'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl =
  'https://dev-k08g234s01hxrf2v.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const kid = jwt.header.kid

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const cert = await getCertificate(kid)
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

async function getCertificate(kid: string): Promise<string> {
  logger.info(`Get certificate from Auth0`)
  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys
  // check keys not undefined and not empty
  if (!keys || !keys.length) throw new Error('not contain any keys')
  const signingKeys = getSigningKeys(keys)
  // check signingKeys not empty
  if (!signingKeys.length)
    throw new Error('not contain any signature verification keys')

  const key = keys.find((key) => key.kid == kid)
  const pub = key.x5c[0] // Get the public key
  let certificate = `-----BEGIN CERTIFICATE-----\n${pub}\n-----END CERTIFICATE-----\n`

  logger.info('certificate', certificate)
  return certificate
}

function getSigningKeys(keys: Jwk[]): Jwk[] {
  return keys.filter(
    (key) =>
      key.use === 'sig' &&
      key.kty === 'RSA' &&
      key.alg === 'RS256' &&
      key.n &&
      key.e &&
      key.kid &&
      key.x5c &&
      key.x5c.length
  )
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = process.env.R2_BUCKET_NAME!
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const AUDIO_MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/wav']

function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) throw new Error('Invalid file type')
  if (buffer.length > MAX_FILE_SIZE) throw new Error('File too large (max 5 MB)')

  const key = `ai-project/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return key
}

export async function uploadAudio(
  buffer: Buffer,
  contentType: string,
  track: string,
  userId: number,
  date: string
): Promise<string> {
  const normalised = contentType.split(';')[0].trim()
  if (!AUDIO_TYPES.includes(normalised)) throw new Error('Invalid audio type')
  if (buffer.length > AUDIO_MAX_SIZE) throw new Error('Audio too large (max 20 MB)')

  const ext = normalised === 'audio/webm' ? 'webm' : normalised === 'audio/mp4' ? 'm4a' : normalised === 'audio/ogg' ? 'ogg' : 'audio'
  const key = `reading/${track}/${userId}/${date}-${Date.now()}.${ext}`
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: normalised,
    })
  )

  return key
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getImageUrl(key: string): Promise<string> {
  // If a public R2 domain is configured, use it directly
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`
  }
  // Otherwise generate a presigned URL (1 hour)
  const client = getClient()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: 3600,
  })
}

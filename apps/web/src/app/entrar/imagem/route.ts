import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { connection } from 'next/server';
import sharp from 'sharp';

const LOCAL_FALLBACK = path.join(process.cwd(), 'public/thumb_todos.JPG');
const OUTPUT_WIDTH = 960;

let cached: Promise<Uint8Array> | null = null;

function loginImageUrl() {
  const trimmed = process.env.LOGIN_IMAGE_URL?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

async function readSource(): Promise<Buffer> {
  const remote = loginImageUrl();
  if (remote) {
    try {
      const response = await fetch(remote, {
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }
    } catch {
      // The local photo is the fallback when the remote file is unreachable.
    }
  }

  return readFile(LOCAL_FALLBACK);
}

async function renderLoginImage() {
  const source = await readSource();
  const jpeg = await sharp(source)
    .rotate()
    .resize({ width: OUTPUT_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 68 })
    .toBuffer();

  return new Uint8Array(jpeg);
}

function loadLoginImage() {
  cached ??= renderLoginImage().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

export async function GET() {
  // Cache Components prerenders GET handlers. connection() keeps the resize
  // on the request, and it must stay outside the catch below: a swallowed
  // prerender bailout would be stored as a 404.
  await connection();

  try {
    const body = await loadLoginImage();
    return new Response(body, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

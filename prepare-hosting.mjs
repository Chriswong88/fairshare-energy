import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('.openai', { recursive: true });
await copyFile('.host/hosting.json', '.openai/hosting.json');
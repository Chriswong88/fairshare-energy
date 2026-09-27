import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve, join} from 'node:path';

const root = process.cwd();
const staging = join(root, '.pages-export');
await rm(staging, {recursive: true, force: true});
await mkdir(staging, {recursive: true});
await cp(join(root, 'app'), join(staging, 'app'), {
  recursive: true,
  filter: (path) => !path.startsWith(join(root, 'app', 'api')),
});
await cp(join(root, 'lib'), join(staging, 'lib'), {recursive: true});
await cp(join(root, 'public'), join(staging, 'public'), {recursive: true});
await cp(join(root, 'tsconfig.json'), join(staging, 'tsconfig.json'));
await cp(join(root, 'next-env.d.ts'), join(staging, 'next-env.d.ts'));
const layoutPath = join(staging, 'app', 'layout.tsx');
let layout = await readFile(layoutPath, 'utf8');
layout = layout
  .replace("import { Geist, Geist_Mono } from 'next/font/google';\n", '')
  .replace(/const geistSans = Geist\([\s\S]*?\);\n\nconst geistMono = Geist_Mono\([\s\S]*?\);\n\n/, '')
  .replace('className={`${geistSans.variable} ${geistMono.variable} antialiased`}', 'className="antialiased"');
await writeFile(layoutPath, layout);
await writeFile(join(staging, 'package.json'), JSON.stringify({private: true, type: 'module'}, null, 2));
await writeFile(join(staging, 'next.config.mjs'), `export default {
  output: 'export',
  basePath: '/fairshare-energy',
  trailingSlash: true,
};\n`);

const next = resolve(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const result = spawnSync(process.execPath, [next, 'build', staging], {
  cwd: root,
  env: {...process.env, NEXT_TELEMETRY_DISABLED: '1'},
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);
await writeFile(join(staging, 'out', '.nojekyll'), '');

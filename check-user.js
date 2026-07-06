import { execSync } from 'child_process';
try {
  console.log('id:', execSync('id', { encoding: 'utf8' }).trim());
  console.log('ls -ld .git:', execSync('ls -ld .git', { encoding: 'utf8' }).trim());
} catch (e) {
  console.error('Error:', e.message);
}

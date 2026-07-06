import { execSync } from 'child_process';

try {
  console.log('Restoring components directory from git...');
  const out1 = execSync('git checkout -- components', { encoding: 'utf8' });
  console.log(out1);
} catch (e) {
  console.error('Error restoring components:', e.message);
}

try {
  console.log('Restoring lib directory from git...');
  const out2 = execSync('git checkout -- lib', { encoding: 'utf8' });
  console.log(out2);
} catch (e) {
  console.error('Error restoring lib:', e.message);
}

try {
  console.log('Restoring app directory from git...');
  const out3 = execSync('git checkout -- app', { encoding: 'utf8' });
  console.log(out3);
} catch (e) {
  console.error('Error restoring app:', e.message);
}

try {
  console.log('Restoring home directory from git...');
  const out4 = execSync('git checkout -- home', { encoding: 'utf8' });
  console.log(out4);
} catch (e) {
  console.error('Error restoring home:', e.message);
}

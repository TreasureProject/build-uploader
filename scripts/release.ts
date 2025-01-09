import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const main = async () => {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    if (!version) {
      throw new Error('Version is missing in package.json');
    }

    console.log(`Creating tag and release for version: v${version}`);

    let lastTag = '';
    try {
      lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
      console.log(`Last release tag: ${lastTag}`);
    } catch {
      console.log('No previous tag found. This is the first release.');
    }

    const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const releaseNotes = execSync(
      `git log ${commitRange} --pretty=format:"* %s (%h)" --no-merges | grep -v "Version Packages"`
    ).toString();

    if (!releaseNotes) {
      console.log(
        'No new commits since the last release (excluding bot commits).'
      );
    } else {
      console.log('Generated release notes:');
      console.log(releaseNotes);
    }

    execSync(`git tag -a v${version} -m "Release v${version}"`, {
      stdio: 'inherit',
    });

    execSync(`git push origin v${version}`, {
      stdio: 'inherit',
    });

    execSync(
      `gh release create v${version} --title "v${version}" --notes "${releaseNotes || 'No changes'}"`,
      {
        stdio: 'inherit',
      }
    );

    console.log(`Successfully created and pushed release v${version}`);
  } catch (error) {
    console.error('Error creating release:', (error as Error).message);
    process.exit(1);
  }
};

main();

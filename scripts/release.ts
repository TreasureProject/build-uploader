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
    let releaseNotes = undefined;
    try {
      releaseNotes = execSync(
        `git log ${commitRange} --pretty=format:"* %s (%h)" | grep -v "Version Packages"`
      ).toString();
      console.log('Generated release notes:');
      console.log(releaseNotes);
    } catch (error: any) {
      console.log(
        `Failed to generate release notes due to error: ${error.message}`
      );
    }

    try {
      execSync(`git tag -a v${version} -m "Release v${version}"`, {
        stdio: 'inherit',
      });
    } catch {
      console.log('Tag already exists. Skipping...');
      process.exit(0);
    }

    execSync(`git push origin v${version}`, {
      stdio: 'inherit',
    });

    const [major, minor] = version.split('.');
    const majorTag = `v${major}`;
    const minorTag = `v${major}.${minor}`;

    try {
      execSync(`git tag -f ${majorTag}`, { stdio: 'inherit' });

      execSync(`git push origin ${majorTag} --force`, {
        stdio: 'inherit',
      });
      console.log(`Updated tag: ${majorTag}`);
    } catch (error: any) {
      console.error(`Failed to update ${majorTag}:`, error.message);
    }

    try {
      execSync(`git tag -f ${minorTag}`, { stdio: 'inherit' });

      execSync(`git push origin ${minorTag} --force`, {
        stdio: 'inherit',
      });
      console.log(`Updated tag: ${minorTag}`);
    } catch (error: any) {
      console.error(`Failed to update ${minorTag}:`, error.message);
    }

    execSync(
      `gh release create v${version} --title "v${version}" --notes "${releaseNotes || 'No changes'}"`,
      {
        stdio: 'inherit',
      }
    );

    console.log(`Successfully created and pushed release v${version}`);
  } catch (error: any) {
    console.error('Error creating release:', error.message);
    process.exit(1);
  }
};

main();

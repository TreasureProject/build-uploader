import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const main = async () => {
  try {
    // Read the package.json file
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version;

    if (!version) {
      throw new Error('Version is missing in package.json');
    }

    console.log(`Creating tag and release for version: v${version}`);

    // Create a Git tag
    execSync(`git tag -a v${version} -m "Release v${version}"`, {
      stdio: 'inherit',
    });

    // Push the tag to the remote repository
    execSync(`git push origin v${version}`, {
      stdio: 'inherit',
    });

    // Create a GitHub release
    execSync(
      `gh release create v${version} --title "Release v${version}" --notes "Automated release for version v${version}"`,
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

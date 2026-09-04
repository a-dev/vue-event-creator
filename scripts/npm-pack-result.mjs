/**
 * Read the tarball filename out of `npm pack --json` output.
 *
 * npm 11 and earlier print an array of pack results; npm 12 prints an object
 * keyed by package name. The release job runs a newer npm than the CI jobs, so
 * both shapes have to be accepted or the packed-consumer checks only fail at
 * publish time.
 */
export function packedTarballName(stdout) {
  const parsed = JSON.parse(stdout);
  const results = Array.isArray(parsed) ? parsed : Object.values(parsed);
  const [first] = results;

  if (!first?.filename) {
    throw new Error(
      `Could not read a tarball filename from npm pack output: ${stdout}`,
    );
  }

  return first.filename;
}

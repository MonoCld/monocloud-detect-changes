import * as core from "@actions/core";
import * as github from "@actions/github";
import micromatch from "micromatch";

export async function run(): Promise<void> {
  try {
    const paths = core.getInput("paths");
    const token = core.getInput("token");

    if (!token) {
      throw new Error("token is required");
    }

    const pathsToCheck = paths.split("\n");

    const octokit = github.getOctokit(token);

    const response = await octokit.rest.repos.compareCommits({
      base: github.context.payload.before,
      head: github.context.payload.after,
      ...github.context.repo,
    });

    const allChangedFiles = response.data.files?.map((x) => x.filename) ?? [];

    if (paths.length > 0) {
      const matched = micromatch(allChangedFiles, pathsToCheck);

      core.setOutput("changed", matched.length > 0);
      core.setOutput("changed_files", matched.join(" "));
    } else {
      core.setOutput("changed", allChangedFiles.length > 0);
      core.setOutput("changed_files", allChangedFiles.join(" "));
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

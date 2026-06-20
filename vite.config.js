import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserSite = repositoryName?.endsWith(".github.io");

export default defineConfig({
  base: process.env.VITE_BASE ?? (repositoryName ? (isUserSite ? "/" : `/${repositoryName}/`) : "/gesture-flora/")
});

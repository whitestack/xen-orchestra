# syntax=docker/dockerfile:1
#
# Copy this file to the ROOT of this documentation repo (next to package.json).
# It layers this repo's built static site on top of the shared docs-gateway
# base image — the JWT verification gate maintained in the
# whitestack-public-docs repo (see apps/docs-gateway/ there for how the base
# itself is built; you never need to touch that repo to ship this one).
#
# 1. Build the site:      npm run build        (produces ./build)
# 2. Build & push image:  docker buildx build --platform linux/amd64 \
#                            -t <region>-docker.pkg.dev/<project>/<artifact-repo>/docs-gateway-<this-repo-id>:<tag> \
#                            --push .
# 3. Point this repo's entry in docs_repos[].image (in whitestack-public-docs'
#    terraform.tfvars) at the image ref from step 2, then `tofu apply`.
#
# Defaults to the :latest base — always the current gate logic, no need to
# track whitestack-public-docs' deploy tags. To pin an exact base version
# instead, override at build time:
#   docker buildx build --build-arg BASE_IMAGE=...docs-gateway-base:20240115-093000 ...
ARG BASE_IMAGE=us-east1-docker.pkg.dev/whitestack-public-docs/whitestack-public-docs/docs-gateway-base:latest
FROM ${BASE_IMAGE}

# Docusaurus' `npm run build` output. Includes an unauthorized.html only if
# this repo has one under static/ — otherwise the base image's default
# (see whitestack-public-docs/apps/docs-gateway/Dockerfile.base) is used.
COPY build /usr/local/openresty/nginx/html

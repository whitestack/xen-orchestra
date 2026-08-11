#!/bin/bash

REPO="us-east1-docker.pkg.dev/whitestack-public-docs/whitestack-public-docs"
NAME="nephora-conductor"
DOCKERFILE=Dockerfile
TAG="$(date -u +%Y%m%d-%H%M%S)"

docker buildx build --platform linux/amd64   -f "$DOCKERFILE"   -t "$REPO/docs-$NAME:$TAG"   --push .

gcloud run services update "docs-gateway-$NAME" \
    --image="$REPO/docs-$NAME:$TAG" \
    --region=us-east1 \
    --project=whitestack-public-docs

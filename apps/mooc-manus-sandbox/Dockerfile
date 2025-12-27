FROM oven/bun:1.3.5 AS bun_binary

FROM ubuntu:22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates git curl unzip sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
COPY --from=bun_binary /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /workspace

# Development stage for dev container
FROM base AS development
# In dev container, code will be mounted via bind mount
# Just ensure workspace directory exists
RUN mkdir -p /workspace

EXPOSE 8081

# Default command for dev container (keeps container running)
# Dev Container will override this with the actual command
CMD ["sleep", "infinity"]

# Production stage (if needed for deployment)
# FROM base AS production
# COPY package.json bun.lock* ./
# COPY apps/mooc-manus-sandbox/package.json ./apps/mooc-manus-sandbox/
# COPY packages ./packages
# RUN bun install --frozen-lockfile --production=false
# COPY . .
# EXPOSE 8081
# CMD ["bun", "run", "apps/mooc-manus-sandbox/src/index.ts"]
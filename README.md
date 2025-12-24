# Mooc Manus

A modern, high-performance monorepo designed for building and managing AI-powered tools and agents. Built with a focus on speed, extensibility, and the Model Context Protocol (MCP).

## 🚀 Overview

Mooc Manus is a sophisticated platform that enables the orchestration of AI agents through a comprehensive tool-calling ecosystem. It leverages the latest web technologies to provide a seamless experience for both developers and users.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), Tailwind CSS, Shadcn
- **Backend**: [ElysiaJS](https://elysiajs.com/) - High-performance web framework for Bun
- **Database**: [Prisma](https://www.prisma.io/) with shared database packages
- **Authentication**: Better Auth
- **AI Tooling**: Model Context Protocol (MCP) SDK, OpenAI integration

## 📂 Project Structure

### Applications (`apps/`)
- **mooc-manus-ui**: A modern React-based dashboard for managing datasets, tools, and interacting with AI agents.
- **mooc-manus-api**: A high-performance API server providing core services and MCP integration.

### Shared Packages (`packages/`)
- **builtin-tool**: Ready-to-use tools including search, weather, and image generation.
- **api-tool**: Infrastructure for dynamic API-based tool integration.
- **prisma-database**: Centralized database schema and Prisma client.
- **common**: Shared utilities, logging, and error handling logic.
- **tencent-cos**: Integration with Tencent Cloud Object Storage.

## 🏁 Getting Started

### Prerequisites
Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation
```bash
bun install
```

### Development
Start all applications and packages in development mode:
```bash
bun run dev
```

### Building
```bash
bun run build
```



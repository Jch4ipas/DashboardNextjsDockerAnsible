# Dashboard Next.js

This project is a dashboard built with **Next.js**, containerized with **Docker**, and deployed using **Ansible**.

## Features
- **Modular interface**: Create customizable boxes whose size is defined directly in the code.
- **NASA API Integration (APOD)**: Display the image of the day from the API.
- **Iframe support**: Allows embedding external content inside boxes.
- **Automated deployment with Ansible**: Simplifies the deployment and configuration management process.

## Prerequisites
Before you begin, make sure you have the following tools installed:
- **Docker** and **Docker Compose**
- **Node.js** (recommended version: 16.x or higher)
- **Ansible** (for automated deployment)

## Installation and Usage

### 1. Run with Docker
If you want to run the dashboard via Docker, use the following command:
```bash
docker run -d jchaipas/dashboardtvfsd:latest
```
This will download and run the Docker image in the background.
### 2. Run with Node.js
If you want to run the project in development mode, follow these steps:
1. Clone the repository:
```bash
git clone https://github.com/Jch4ipas/DashboardNextjsDockerAnsible.git
```
2. Navigate to the project directory:
```bash
cd DashboardNextjsDockerAnsible/nextjs
```
3. Install the dependencies:
```bash
npm install
```
4. Start the development server
```bash
npm run dev
```
This will start the Next.js server locally. By default, the application will be accessible at http://localhost:3000.

### 3. Deployment with Ansible
If you want to deploy the dashboard automatically on a remote server, you can use Ansible:

1. Modify the inventory/prod.yml configuration file to include your server address.
2. Run the Ansible playbook to deploy:
```bash
./dashboardsible
```

## Project Structure
- /nextjs: Contains the Next.js project files.
- /ansible: Contains the configurations required for automated deployment with Ansible.
- /docker: Contains Docker and Docker Compose configuration files.

## My Other project
You can see my other project [here](https://github.com/Jch4ipas?tab=repositories)

# ansible manager

This is an open-source app with following features

- search for a server / group / inventory inside project
- scrape applied variables for a given server from all files
- visualize project server structure in a tree
- make & push changes to existing server variables
- assemble & run ansible commands with simple command builder
- log the command execution results and look them up in a dashboard

## How to run the app

#### development environment

1) add .env.development file to packages/backend folder with given content:

```ini
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=logs_user
DATABASE_PASSWORD=complex_password123
DATABASE_NAME=logs_database
GIT_USERNAME=your_username
GIT_PASSWORD=your_password
ANSIBLE_REPOS_PATH=C:\Users\John_doe\Desktop\ansible_bp\packages\backend\ansible_repos
```
2) run command `yarn dev` in the root of the project

#### production environment
1) add .env.development file to packages/backend folder with given content:

```ini
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=logs_user
DATABASE_PASSWORD=complex_password123
DATABASE_NAME=logs_database
GIT_USERNAME=your_username
GIT_PASSWORD=your_password
ANSIBLE_REPOS_PATH=/app/ansible_repos
```

2) run command `docker-compose up --build` in the root of the project


If you find any bugs, feel free to open an issue.

PS: This is a bachelor thesis project. Pray for my finals.
import { Injectable } from '@nestjs/common';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseIni } from 'ini';
import { parse as parseYaml } from 'yaml';
import { extname } from 'path';
import { ProjectsHosts } from '../types';

@Injectable()
export class FileProcessorService {
  private ansibleReposPath =
    'C:\\Users\\VJochim\\Desktop\\Ansible_BP\\packages\\backend\\ansible_repos'; // "/app/ansible_repos" inside docker container
  private possibleInventoryFiles = ['hosts.ini', 'hosts', 'hosts.yaml'];
  private directoriesToIgnore = [
    'roles',
    'utils',
    '.githooks',
    'certs',
    'templates',
    'vars',
    'assets',
    'env',
    'modules',
    '.git',
    'group_vars',
    'host_vars',
  ];

  extractHostsFromIniFile(iniFileContent): string[] {
    const hosts = [];
    const parsedIni = parseIni(iniFileContent);
    const iniGroups = Object.keys(parsedIni);
    for (const iniGroup of iniGroups) {
      const groupHosts = Object.keys(parsedIni[iniGroup]);
      hosts.push(...groupHosts);
    }
    return [...new Set(hosts)];
  }

  extractHostsFromYamlFile(yamlFileContent): string[] {
    const hosts = [];
    const parsedYaml = parseYaml(yamlFileContent);
    function extractHosts(yamlData) {
      if (yamlData && typeof yamlData === 'object') {
        if (yamlData.hosts) {
          hosts.push(...Object.keys(yamlData.hosts));
        }
        for (const childKey in yamlData) {
          extractHosts(yamlData[childKey]);
        }
      }
    }
    extractHosts(parsedYaml);
    return [...new Set(hosts)];
  }

  getProjectsHosts(): ProjectsHosts {
    console.log('getProjectHosts called succesfully');
    const projectsHosts = [];
    const projects = readdirSync(this.ansibleReposPath);

    for (const project of projects) {
      const projectPath = join(this.ansibleReposPath, project);
      const inventoryPaths = this.getInventoryFilesPaths(projectPath);

      const hosts = [];
      for (const inventoryPath of inventoryPaths) {
        const inventoryExtension = extname(inventoryPath);
        const fileContent = readFileSync(inventoryPath, 'utf-8');
        if (inventoryExtension === '.ini' || inventoryExtension === '') {
          const inventoryHosts = this.extractHostsFromIniFile(fileContent);
          hosts.push(...inventoryHosts);
        } else {
          const inventoryHosts = this.extractHostsFromYamlFile(fileContent);
          hosts.push(...inventoryHosts);
        }
      }
      projectsHosts.push({ project, hosts });
    }
    return projectsHosts;
  }

  getInventoryFilesPaths(dir): string[] {
    const files = readdirSync(dir);

    let inventoryFilesPaths = [];

    for (const file of files) {
      if (this.directoriesToIgnore.includes(file)) {
        continue;
      }
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        inventoryFilesPaths = inventoryFilesPaths.concat(this.getInventoryFilesPaths(filePath));
      } else {
        if (this.possibleInventoryFiles.includes(file)) {
          inventoryFilesPaths.push(filePath);
        }
      }
    }
    return inventoryFilesPaths;
  }

  getHostDetails(projectName, hostName) {}
}

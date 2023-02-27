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
    return hosts;
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

    return hosts;
  }

  removeDuplicateHosts(array: ProjectsHosts): ProjectsHosts {
    const unique = {};
    array.forEach(function (i) {
      if (!unique[i.project]) {
        unique[i.project] = [];
      }
      i.hosts.forEach(function (j) {
        if (unique[i.project].indexOf(j) === -1) {
          unique[i.project].push(j);
        }
      });
    });
    const result = [];
    for (const key in unique) {
      result.push({ project: key, hosts: unique[key] });
    }
    return result;
  }

  joinHostsOnProject(arr: ProjectsHosts): ProjectsHosts {
    const result = [];
    arr.forEach((obj) => {
      const index = result.findIndex((item) => item.project === obj.project);

      if (index >= 0) {
        result[index].hosts = [...result[index].hosts, ...obj.hosts];
      } else {
        result.push({ project: obj.project, hosts: obj.hosts });
      }
    });
    return result;
  }

  getProjectsHosts(): ProjectsHosts {
    const projectsHosts = [];
    const projects = readdirSync(this.ansibleReposPath);

    for (const project of projects) {
      const projectPath = join(this.ansibleReposPath, project);
      const inventoryFilesPaths = this.getInventoryFilesPaths(projectPath);

      for (const inventoryFilePath of inventoryFilesPaths) {
        const inventoryExtension = extname(inventoryFilePath);
        const fileContent = readFileSync(inventoryFilePath, 'utf-8');

        if (inventoryExtension === '.ini' || inventoryExtension === '') {
          const hosts = this.extractHostsFromIniFile(fileContent);
          projectsHosts.push({ project, hosts });
        } else {
          const hosts = this.extractHostsFromYamlFile(fileContent);
          projectsHosts.push({ project, hosts });
        }
      }
    }

    return this.removeDuplicateHosts(this.joinHostsOnProject(projectsHosts));
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
}

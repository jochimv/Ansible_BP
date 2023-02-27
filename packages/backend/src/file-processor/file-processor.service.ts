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
        // If it is, recursively call this function on the subdirectory
        inventoryFilesPaths = inventoryFilesPaths.concat(this.getInventoryFilesPaths(filePath));
      } else {
        if (this.possibleInventoryFiles.includes(file)) {
          // If it's a file, add its path to the array
          inventoryFilesPaths.push(filePath);
        }
      }
    }
    return inventoryFilesPaths;
  }
}

/*

extractSecondLastPathSegment(path) {
        const pathSegments = path.split("/");
        return pathSegments[pathSegments.length - 2];
    }

getProjects(): Project[]{
    const projects = readdirSync(this.ansibleReposPath);

    /!*
    // v INI to má inventory typ (dá se nalézt na cestě, například prod), a group name ([webservers])
    // v YAML to má group name a inventory typ v jednom
    target:
     [{project: 'ansible-kafka', inventories: [{inventoryType: 'dev', groups: [{name: 'webservers', hosts: [node1, node2, node3]}]}]}]
     [{project: 'ansible-kafka', groups: [{groupType: 'dev', hosts: [{name: 'webservers', hosts: [node1, node2, node3]}]}]}]
    *!/

    const returnedArray = [];
    for (const project of projects){
        const projectPath = join(this.ansibleReposPath, project);
        const inventoryFilesPaths = this.getInventoryFilesPaths(projectPath);
        const inventories = [];
        for (const inventoryFilesPath of inventoryFilesPaths){
            const inventoryExtension = extname(inventoryFilesPath);
            const fileContent = readFileSync(inventoryFilesPath, 'utf-8');
            let inventoryType;
            const groups = []; // dev, prod, ...
            if(inventoryExtension === '.ini' ||  inventoryExtension === ''){
                inventoryType = this.extractSecondLastPathSegment(inventoryFilesPath);
                const parsedIni = parseIni(fileContent);
                const iniGroups = Object.keys(parsedIni);
                for (const iniGroup of iniGroups){
                    const hosts = Object.keys(parsedIni[iniGroup]);
                    groups.push({name: iniGroup, hosts })
                }
            } else {
                inventoryType = undefined; // in yaml, inventory type = group name ?
                const parsedYaml = parseYaml(fileContent);
                const yamlGroups = Object.keys(parsedYaml.all.children);

            }
            inventories.push({inventoryType, groups});
        }
        returnedArray.push({project, inventories});
    }
    return returnedArray;
}*/

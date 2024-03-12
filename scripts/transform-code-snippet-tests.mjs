// Importing necessary modules from the 'fs' package and the 'path' module
import { readdir, readFile, writeFile } from 'fs';
import { join } from 'path';

const testCodeSnippetDirectory = './test-e2e/code-snippets';

const extractImports = (content) => {
  const importRegex = /^import [^]*? from .*;$/gm;
  return content.match(importRegex) || [];
};

const transformTestToSnippet = (content) => {
  // Remove expect statements
  content = content.replace(/expect\([^]*?\).*\([^]*?\);/gm, '');

  // Regex to match the body of "it" functions
  const itBodyRegex =
    /it\(['"`].+['"`],\s*(?:async\s*)?\(\)\s*=>\s*\{([\s\S]*?)\}\);/g;
  let transformedContent = '';
  let match;

  // Extract the body of each "it" function
  while ((match = itBodyRegex.exec(content)) !== null) {
    transformedContent += match[1].trim() + '\n';
  }

  return transformedContent;
};

/**
 * Reads and transforms test files from a specified directory into code snippets.
 */
readdir(testCodeSnippetDirectory, (err, files) => {
  if (err) {
    console.error(`Error reading the directory: ${err}`);
    return;
  }

  const specFiles = files.filter((file) => file.endsWith('.spec.ts'));

  specFiles.forEach((fileName) => {
    const filePath = join(testCodeSnippetDirectory, fileName);

    readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        console.error(`Error reading the file ${filePath}: ${err}`);
        return;
      }

      const importStatements = extractImports(content).join('\n');
      const transformedContent = transformTestToSnippet(content);
      const snippetContent = `${importStatements}\n\n${transformedContent}`;

      const newFilePath = join(
        './code-snippets',
        fileName.replace('.spec', ''),
      );

      writeFile(newFilePath, snippetContent, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing the file ${newFilePath}: ${err}`);
          return;
        }
        console.log(`Successfully transformed ${filePath} to ${newFilePath}`);
      });
    });
  });
});

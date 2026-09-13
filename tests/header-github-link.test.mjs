import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function readBuiltStyles() {
	const assetDir = path.join(process.cwd(), 'dist', '_astro');
	const entries = await readdir(assetDir, { withFileTypes: true });
	const styleFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.css'));
	return Promise.all(styleFiles.map((entry) => readFile(path.join(assetDir, entry.name), 'utf8')))
		.then((styles) => styles.join('\n').replace(/\s+/g, ''));
}

test('页头 GitHub 按钮安全地打开个人主页并具有可访问名称', async () => {
	const homePage = await readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
	const githubLink = homePage.match(/<a\b(?=[^>]*class="github-link")[^>]*>[\s\S]*?<\/a>/)?.[0];

	assert.ok(githubLink, '页头应包含 GitHub 按钮');
	assert.match(githubLink, /href="https:\/\/github\.com\/DreamCasterZero"/);
	assert.match(githubLink, /target="_blank"/);
	assert.match(githubLink, /rel="noreferrer"/);
	assert.match(githubLink, /aria-label="访问 DreamCasterZero 的 GitHub"/);
	assert.match(githubLink, /<svg\b[^>]*aria-hidden="true"/);
});

test('GitHub 按钮始终横向排列在主题按钮左侧', async () => {
	const homePage = await readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
	const actions = homePage.match(/<div\b(?=[^>]*class="header-actions")[^>]*>[\s\S]*?<\/div>/)?.[0];
	assert.ok(actions, '页头应包含操作按钮容器');
	assert.ok(actions.indexOf('class="github-link"') < actions.indexOf('class="theme-toggle"'), 'GitHub 按钮应位于主题按钮左侧');

	const styles = await readBuiltStyles();
	const actionRule = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.find(([, selectors, declarations]) => selectors.includes('.header-actions') && declarations.includes('display:inline-flex'));
	assert.ok(actionRule, '页头操作区应使用 inline-flex 横向容器');
	assert.ok(actionRule[2].includes('flex-flow:row'), '页头操作区应横向排列且不换行');
	assert.ok(actionRule[2].includes('width:max-content'), '页头操作区应保留两个按钮所需宽度');
});

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDir = path.join(process.cwd(), 'dist');

async function readHomePage() {
	return readFile(path.join(outputDir, 'index.html'), 'utf8');
}

async function readBuiltStyles(homePage) {
	const assetDir = path.join(outputDir, '_astro');
	const entries = await readdir(assetDir, { withFileTypes: true });
	const styleFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.css'));
	const linkedStyles = await Promise.all(styleFiles.map((entry) => readFile(path.join(assetDir, entry.name), 'utf8')));
	return [homePage, ...linkedStyles].join('\n').replace(/\s+/g, '');
}

function getLatestSection(homePage) {
	const latestSection = homePage.match(/<section\b(?=[^>]*class="latest")[^>]*>([\s\S]*?)<\/section>/)?.[1];
	assert.ok(latestSection, '首页应包含最新文章区');
	return latestSection;
}

function getSectionsArea(homePage) {
	const sectionsArea = homePage.match(/<section\b(?=[^>]*class="home-sections")[^>]*>([\s\S]*?)<\/section>/)?.[1];
	assert.ok(sectionsArea, '首页应包含版块区');
	return sectionsArea;
}

function hasRule(styles, selectorFragment, declarationFragment) {
	const selectorFragments = Array.isArray(selectorFragment) ? selectorFragment : [selectorFragment];
	return [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(([, selectors, declarations]) =>
		selectors.split(',').some((selector) => selectorFragments.every((fragment) => selector.includes(fragment)))
		&& declarations.includes(declarationFragment),
	);
}

test('首页最新文章仅展示完整日期和标题', async () => {
	const latestSection = getLatestSection(await readHomePage());

	assert.match(latestSection, /<time[^>]*>2026年8月25日<\/time>/);
	assert.match(latestSection, /href="\/blog\/robot-motion-control-notes\/"[^>]*>从一个速度环开始：机器人运动控制的工程化笔记<\/a>/);
	assert.doesNotMatch(latestSection, /分钟阅读/);
	assert.doesNotMatch(latestSection, /class="post-description"/);
	assert.doesNotMatch(latestSection, /aria-label="文章标签"/);
});

test('首页区标题使用横线连接归档入口', async () => {
	const latestSection = getLatestSection(await readHomePage());

	assert.match(latestSection, /<h2[^>]*>最新文章<\/h2><span[^>]*class="section-rule"[^>]*aria-hidden="true"[^>]*><\/span><a href="\/archive\/"[^>]*>查看全部/);
});

test('首页文章标题默认带下划线并在悬停时变红', async () => {
	const homePage = await readHomePage();
	const styles = await readBuiltStyles(homePage);

	assert.ok(hasRule(styles, '.home-post-title', 'text-decoration-line:underline'), '首页文章标题应默认显示下划线');
	assert.ok(hasRule(styles, ['.home-post-title', ':hover'], 'color:var(--nav-active)'), '悬停首页文章标题时文字应变红');
	assert.ok(hasRule(styles, ['.home-post-title', ':focus-visible'], 'color:var(--nav-active)'), '键盘聚焦首页文章标题时文字应变红');
});

test('首页版块区展示四个已确认方向及其说明', async () => {
	const sectionsArea = getSectionsArea(await readHomePage());

	for (const [title, description] of [
		['数学基础', '机器人与控制中常用的数学、建模与推导。'],
		['运动控制', '记录控制理论、算法实现与现场调试经验。'],
		['大模型知识', '整理模型原理、工具使用与应用实践。'],
		['人形机器人', '关注感知、规划、控制与整机系统。'],
	]) {
		assert.match(sectionsArea, new RegExp(`<h3[^>]*>${title}<\\/h3>`));
		assert.match(sectionsArea, new RegExp(`<p[^>]*>${description}<\\/p>`));
	}

	assert.equal(sectionsArea.match(/class="section-card"/g)?.length, 4);
});

test('尚无文章的首页版块不提供误导性的交互入口', async () => {
	const sectionsArea = getSectionsArea(await readHomePage());

	assert.doesNotMatch(sectionsArea, /<(?:a|button)\b/);
});

test('首页版块在宽屏使用两列并在窄屏改为单列', async () => {
	const homePage = await readHomePage();
	const styles = await readBuiltStyles(homePage);

	assert.ok(hasRule(styles, '.section-grid', 'grid-template-columns:repeat(2,minmax(0,1fr))'), '宽屏版块应使用两列');
	assert.ok(hasRule(styles, '.section-grid', 'grid-template-columns:1fr'), '窄屏版块应使用单列');
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const outputDir = path.join(process.cwd(), 'dist');

async function readBuiltPage(...segments) {
	return readFile(path.join(outputDir, ...segments, 'index.html'), 'utf8');
}

function getNavigation(page, label) {
	const navigation = page.match(new RegExp(`<nav\\b[^>]*aria-label="${label}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1];
	assert.ok(navigation, `页面应包含“${label}”`);
	return navigation;
}

test('主导航和页脚使用归档作为唯一文章索引入口', async () => {
	const homePage = await readBuiltPage();
	const headerNavigation = getNavigation(homePage, '主导航');
	const footerNavigation = getNavigation(homePage, '页脚导航');

	for (const navigation of [headerNavigation, footerNavigation]) {
		assert.match(navigation, /href="\/archive\/"[^>]*>归档<\/a>/);
		assert.doesNotMatch(navigation, /href="\/blog\/"[^>]*>文章<\/a>/);
	}
});

test('首页总览和文章返回入口都指向归档页', async () => {
	const homePage = await readBuiltPage();
	const articlePage = await readBuiltPage('blog', 'robot-motion-control-notes');

	assert.match(homePage, /<a href="\/archive\/"[^>]*>查看全部/);
	assert.match(articlePage, /<a[^>]*class="back-link"[^>]*href="\/archive\/"[^>]*>← 返回归档<\/a>/);
});

test('文章详情页将归档标记为当前栏目', async () => {
	const articlePage = await readBuiltPage('blog', 'robot-motion-control-notes');
	const headerNavigation = getNavigation(articlePage, '主导航');

	assert.match(headerNavigation, /href="\/archive\/"[^>]*class="active"[^>]*aria-current="page"[^>]*>归档<\/a>/);
});

test('归档页按最近年份优先展示完整日期和文章标题', async () => {
	const archivePage = await readBuiltPage('archive');
	const year2026 = archivePage.indexOf('id="year-2026"');
	const year2025 = archivePage.indexOf('id="year-2025"');

	assert.ok(year2026 >= 0 && year2025 >= 0, '归档页应包含现有文章年份');
	assert.ok(year2026 < year2025, '最近年份应排在前面');
	assert.match(archivePage, /<time[^>]*>2026年8月25日<\/time>/);
	assert.match(archivePage, /href="\/blog\/robot-motion-control-notes\/"[^>]*>从一个速度环开始：机器人运动控制的工程化笔记<\/a>/);
	assert.doesNotMatch(archivePage, />Archive</);
	assert.doesNotMatch(archivePage, />\d+ 分钟</);
});

test('归档页提供由已发布文章生成的标签索引', async () => {
	const archivePage = await readBuiltPage('archive');
	const tagIndex = archivePage.match(/<aside\b[^>]*aria-label="标签索引"[^>]*>([\s\S]*?)<\/aside>/)?.[1];

	assert.ok(tagIndex, '归档页应包含标签索引');
	assert.match(tagIndex, />Tags</);
	assert.match(tagIndex, /href="\/tags\/%E6%9C%BA%E5%99%A8%E4%BA%BA\/"[^>]*>机器人<\/a>/);
	assert.match(tagIndex, /href="\/tags\/%E7%94%9F%E6%B4%BB%E8%AE%B0%E5%BD%95\/"[^>]*>生活记录<\/a>/);
});

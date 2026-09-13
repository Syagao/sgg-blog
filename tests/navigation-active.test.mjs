import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, 'dist');

async function readBuiltStyles() {
	const assetDir = path.join(outputDir, '_astro');
	const entries = await readdir(assetDir, { withFileTypes: true });
	const styleFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.css'));
	return Promise.all(styleFiles.map((entry) => readFile(path.join(assetDir, entry.name), 'utf8')))
		.then((styles) => styles.join('\n'));
}

function readHexColor(styles, customProperty, theme = 'light') {
	const scope = theme === 'dark'
		? styles.match(/:root\[data-theme=(?:['"])?dark(?:['"])?\]\{([^}]*)\}/)?.[1]
		: styles.match(/:root\{([^}]*)\}/)?.[1];
	assert.ok(scope, `找不到 ${theme} 主题变量`);

	const value = scope.match(new RegExp(`${customProperty}:#([0-9a-f]{6})`, 'i'))?.[1];
	assert.ok(value, `找不到 ${theme} 主题的 ${customProperty}`);
	return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function hasRule(styles, selectorFragment, declarationFragment) {
	const selectorFragments = Array.isArray(selectorFragment) ? selectorFragment : [selectorFragment];
	return [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(([, selectors, declarations]) =>
		selectors.split(',').some((selector) => selectorFragments.every((fragment) => selector.includes(fragment)))
		&& declarations.includes(declarationFragment),
	);
}

test('当前导航项使用红色文字且不显示底部装饰线', async () => {
	const aboutPage = await readFile(path.join(outputDir, 'about', 'index.html'), 'utf8');
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.match(aboutPage, /<a[^>]*class="active"[^>]*aria-current="page"[^>]*>关于<\/a>/);
	assert.match(styles, /\.active\{color:var\(--nav-active\)\}/);
	assert.doesNotMatch(styles, /\.active:(?:after|:after)\{/);

	for (const theme of ['light', 'dark']) {
		const [red, green, blue] = readHexColor(styles, '--nav-active', theme);
		assert.ok(red > green && red > blue, `${theme} 主题的当前项颜色应以红色分量为主`);
	}
});

test('悬停或键盘聚焦导航项时显示红色文字和展开式下划线', async () => {
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.ok(hasRule(styles, ':hover', 'color:var(--nav-active)'), '悬停文字应变为红色');
	assert.ok(hasRule(styles, ':focus-visible', 'color:var(--nav-active)'), '键盘聚焦文字应变为红色');
	assert.ok(hasRule(styles, ':after', 'transform:scaleX(0)'), '下划线静止时应收起');
	assert.ok(hasRule(styles, ':hover:after', 'transform:scaleX(1)'), '悬停时下划线应展开');
	assert.ok(hasRule(styles, ':focus-visible:after', 'transform:scaleX(1)'), '键盘聚焦时下划线应展开');
});

test('桌面端下划线忽略分隔线占用的左侧留白', async () => {
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.ok(hasRule(styles, 'a+a', 'padding-left:1.25rem'), '相邻导航项应保留分隔线留白');
	assert.ok(hasRule(styles, 'a+a:after', 'left:1.25rem'), '下划线起点应跳过分隔线留白');
});

test('移动端下划线不保留桌面分隔线的偏移', async () => {
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.ok(hasRule(styles, 'a+a:after', 'left:0'), '移动端下划线应恢复为文字的完整宽度');
});

test('页脚索引悬停或键盘聚焦时显示红色文字和展开式下划线', async () => {
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.ok(hasRule(styles, ['.footer-nav', ':hover'], 'color:var(--nav-active)'), '页脚索引悬停时文字应变红');
	assert.ok(hasRule(styles, ['.footer-nav', ':focus-visible'], 'color:var(--nav-active)'), '页脚索引聚焦时文字应变红');
	assert.ok(hasRule(styles, ['.footer-nav', ':after'], 'transform:scaleX(0)'), '页脚下划线静止时应收起');
	assert.ok(hasRule(styles, ['.footer-nav', ':hover:after'], 'transform:scaleX(1)'), '页脚索引悬停时下划线应展开');
	assert.ok(hasRule(styles, ['.footer-nav', ':focus-visible:after'], 'transform:scaleX(1)'), '页脚索引聚焦时下划线应展开');
});

test('页脚下划线忽略分隔线占用的左侧留白', async () => {
	const styles = (await readBuiltStyles()).replace(/\s+/g, '');

	assert.ok(hasRule(styles, ['.footer-nav', '+a', ':after'], 'left:1.25rem'), '桌面端下划线应跳过分隔线留白');
	assert.ok(hasRule(styles, ['.footer-nav', '+a', ':after'], 'left:1rem'), '移动端下划线应跳过较小的分隔线留白');
});

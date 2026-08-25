import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
	const posts = await getCollection('blog', ({ data }) => !import.meta.env.PROD || !data.draft);

	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getReadingTime(body = ''): number {
	const plainText = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_`\-[\](){}|]/g, ' ');
	const chineseCharacters = plainText.match(/[\u3400-\u9fff]/g)?.length ?? 0;
	const latinWords = plainText.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;

	return Math.max(1, Math.ceil(chineseCharacters / 400 + latinWords / 220));
}

export function formatDate(date: Date): string {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);
}

export function getTagHref(tag: string): string {
	return `/tags/${encodeURIComponent(tag)}/`;
}

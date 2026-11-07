export type OgType = 'website' | 'article' | 'video.other' | 'profile';

export interface MainLayoutProps {
	title: string;
	description?: string;
	keywords?: string[];
	ogImage?: string;
	ogType?: OgType;
	canonicalUrl?: string;
	noIndex?: boolean;
	jsonLd?: Record<string, unknown> | null;
}

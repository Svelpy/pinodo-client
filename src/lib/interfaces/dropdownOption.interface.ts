import type { Component } from 'svelte';

export interface DropdownOption {
	id: string;
	icon?: Component;
	label: string;
	action?: () => void;
	divider?: boolean;
	disabled?: boolean;
}
